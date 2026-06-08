import os
import threading
import time
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from db import get_client
from helpers_auth import require_auth, validate_institution_email
from helpers_tasks import (
    fetch_task,
    fetch_tasks_for_feed,
    update_task_state,
    assign_performer,
    set_proof_photo,
    fetch_user_task_counts
)
from helpers_escrow import release_escrow, apply_penalty, refund_escrow
from helpers_trust import recalculate_trust_score, apply_abandonment_penalty
from helpers_advisory import get_price_advisory
from helpers_piggyback import find_piggyback_tasks

app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "blok-secret-key-change-me")


# =====================================================================
# ROUTES — AUTH
# =====================================================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    body = request.get_json()

    email = body["email"]
    full_name = body["full_name"]
    institution_email = body["institution_email"]
    campus_id = body["campus_id"]
    penalty_agreement = body["penalty_agreement"]
    privacy_agreement = body["privacy_agreement"]

    # Optional field
    student_id_photo_url = None
    if "student_id_photo_url" in body:
        student_id_photo_url = body["student_id_photo_url"]

    # Validate institution email domain
    if not validate_institution_email(institution_email):
        return jsonify({"error": "Institution email must be from an approved educational domain."}), 400

    # Validate agreements
    if not penalty_agreement or not privacy_agreement:
        return jsonify({"error": "Both agreements are required to register."}), 400

    sb = get_client()

    # Create auth user in Supabase
    try:
        # Check if password provided for email+password auth
        password = body["password"]
        auth_response = sb.auth.sign_up({
            "email": email,
            "password": password
        })
    except Exception as e:
        return jsonify({"error": "Failed to create auth account: " + str(e)}), 500

    if auth_response.user is None:
        return jsonify({"error": "Failed to create auth user."}), 500

    user_id = str(auth_response.user.id)

    # Insert into users table
    user_data = {
        "user_id": user_id,
        "email": email,
        "full_name": full_name,
        "institution_email": institution_email,
        "campus_id": campus_id,
        "penalty_agreement": penalty_agreement,
        "privacy_agreement": privacy_agreement,
        "onboarding_done": True
    }

    if student_id_photo_url is not None:
        user_data["student_id_photo"] = student_id_photo_url

    try:
        sb.table("users").insert(user_data).execute()
    except Exception as e:
        return jsonify({"error": "Failed to insert user record: " + str(e)}), 500

    return jsonify({"user_id": user_id, "message": "Registration complete."}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json()

    email = body["email"]
    password = body["password"]

    sb = get_client()

    try:
        auth_response = sb.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
    except Exception as e:
        return jsonify({"error": "Login failed: " + str(e)}), 401

    if auth_response.session is None:
        return jsonify({"error": "Invalid credentials."}), 401

    return jsonify({
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "user_id": str(auth_response.user.id),
        "expires_in": auth_response.session.expires_in
    }), 200


# =====================================================================
# ROUTES — USERS
# =====================================================================

@app.route("/api/users/me", methods=["GET"])
def get_me():
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    sb = get_client()
    result = sb.table("users").select("*").eq("user_id", user_id).execute()

    if len(result.data) == 0:
        return jsonify({"error": "User not found."}), 404

    user = result.data[0]

    # Never expose sensitive fields
    if "sso_token" in user:
        del user["sso_token"]
    if "student_id_photo" in user:
        del user["student_id_photo"]

    # Include task counts
    counts = fetch_user_task_counts(user_id)
    user["tasks_posted"] = counts["tasks_posted"]
    user["tasks_completed"] = counts["tasks_completed"]

    return jsonify(user), 200


@app.route("/api/users/me/wallet/topup", methods=["PATCH"])
def topup_wallet():
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    body = request.get_json()
    amount = float(body["amount"])

    if amount <= 0:
        return jsonify({"error": "Top-up amount must be positive."}), 400

    sb = get_client()

    user_result = sb.table("users").select("wallet_balance").eq("user_id", user_id).execute()

    if len(user_result.data) == 0:
        return jsonify({"error": "User not found."}), 404

    current_balance = float(user_result.data[0]["wallet_balance"])
    new_balance = current_balance + amount

    sb.table("users").update({"wallet_balance": new_balance}).eq("user_id", user_id).execute()

    return jsonify({"wallet_balance": new_balance}), 200


# =====================================================================
# ROUTES — TASKS
# =====================================================================

@app.route("/api/tasks/feed", methods=["GET"])
def get_task_feed():
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    campus_id = request.args["campus_id"]

    tasks = fetch_tasks_for_feed(campus_id, user_id)

    # Flatten the joined poster data
    feed = []
    for task in tasks:
        if "users" in task and task["users"] is not None:
            task["poster_full_name"] = task["users"]["full_name"]
            task["poster_trust_score"] = task["users"]["trust_score"]
            del task["users"]
        feed.append(task)

    return jsonify(feed), 200


@app.route("/api/tasks", methods=["POST"])
def create_task():
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    body = request.get_json()

    title = body["title"]
    description = body["description"]
    category = body["category"]
    pricing_type = body["pricing_type"]
    reward_amount = float(body["reward_amount"])
    campus_id = body["campus_id"]
    base_block = body["base_block"]
    target_block = body["target_block"]
    is_remote = body["is_remote"]
    expires_at = body["expires_at"]

    # Optional fields
    deadline_at = None
    if "deadline_at" in body:
        deadline_at = body["deadline_at"]

    completion_passcode = None
    if "completion_passcode" in body:
        completion_passcode = body["completion_passcode"]

    # Validate title length
    if len(title) > 60:
        return jsonify({"error": "Title must be 60 characters or fewer."}), 400

    # Check wallet balance
    sb = get_client()
    user_result = sb.table("users").select("wallet_balance").eq("user_id", user_id).execute()

    if len(user_result.data) == 0:
        return jsonify({"error": "User not found."}), 404

    wallet_balance = float(user_result.data[0]["wallet_balance"])

    if wallet_balance < reward_amount:
        return jsonify({"error": "Insufficient wallet balance to post this task."}), 400

    # Deduct reward from wallet
    new_balance = wallet_balance - reward_amount
    sb.table("users").update({"wallet_balance": new_balance}).eq("user_id", user_id).execute()

    # Insert task
    task_data = {
        "poster_id": user_id,
        "title": title,
        "description": description,
        "category": category,
        "pricing_type": pricing_type,
        "reward_amount": reward_amount,
        "campus_id": campus_id,
        "base_block": base_block,
        "target_block": target_block,
        "is_remote": is_remote,
        "task_state": "Published",
        "expires_at": expires_at
    }

    if deadline_at is not None:
        task_data["deadline_at"] = deadline_at

    if completion_passcode is not None:
        task_data["completion_passcode"] = completion_passcode

    task_result = sb.table("tasks").insert(task_data).execute()
    task_id = task_result.data[0]["task_id"]

    # Insert escrow
    escrow_data = {
        "task_id": task_id,
        "poster_id": user_id,
        "amount": reward_amount,
        "status": "held"
    }
    sb.table("escrow").insert(escrow_data).execute()

    # Insert price history record
    price_history_data = {
        "campus_id": campus_id,
        "base_block": base_block,
        "target_block": target_block,
        "category": category,
        "reward_amount": reward_amount
    }
    sb.table("task_price_history").insert(price_history_data).execute()

    return jsonify({"task_id": task_id}), 201


@app.route("/api/tasks/<task_id>/accept", methods=["POST"])
def accept_task(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    task = fetch_task(task_id)

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    if task["task_state"] != "Published":
        return jsonify({"error": "Task is not available for acceptance."}), 400

    if task["poster_id"] == user_id:
        return jsonify({"error": "You cannot accept your own task."}), 400

    # Update task
    assign_performer(task_id, user_id)

    # Update escrow with performer
    sb = get_client()
    sb.table("escrow").update({"performer_id": user_id}).eq("task_id", task_id).execute()

    return jsonify({"message": "Task accepted.", "task_id": task_id}), 200


@app.route("/api/tasks/<task_id>/start", methods=["POST"])
def start_task(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    task = fetch_task(task_id)

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    if task["performer_id"] != user_id:
        return jsonify({"error": "Only the assigned performer can start this task."}), 403

    if task["task_state"] != "Accepted":
        return jsonify({"error": "Task must be in Accepted state to start."}), 400

    update_task_state(task_id, "In-Progress")

    return jsonify({"message": "Task started.", "task_id": task_id}), 200


@app.route("/api/tasks/<task_id>/complete", methods=["POST"])
def complete_task(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    task = fetch_task(task_id)

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    if task["performer_id"] != user_id:
        return jsonify({"error": "Only the assigned performer can complete this task."}), 403

    if task["task_state"] != "In-Progress":
        return jsonify({"error": "Task must be In-Progress to complete."}), 400

    body = request.get_json()

    # Passcode verification
    if task["completion_passcode"] is not None and task["completion_passcode"] != "":
        if "passcode" not in body:
            return jsonify({"error": "Completion passcode is required for this task."}), 400
        if body["passcode"] != task["completion_passcode"]:
            return jsonify({"error": "Incorrect completion passcode."}), 400

    # Photo proof
    if "proof_photo_url" in body:
        set_proof_photo(task_id, body["proof_photo_url"])

    # Update task state
    update_task_state(task_id, "Completed")

    # Release escrow
    release_escrow(task_id)

    return jsonify({"message": "Task completed. Funds released.", "task_id": task_id}), 200


@app.route("/api/tasks/<task_id>/dispute", methods=["POST"])
def dispute_task(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    task = fetch_task(task_id)

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    # Only poster or performer may raise dispute
    if task["poster_id"] != user_id and task["performer_id"] != user_id:
        return jsonify({"error": "Only the poster or performer can raise a dispute."}), 403

    # Update task state to Disputed
    update_task_state(task_id, "Disputed")

    # Freeze escrow — do not release or refund (escrow stays in 'held' status)

    return jsonify({"message": "Dispute raised. Escrow frozen.", "task_id": task_id}), 200


@app.route("/api/tasks/<task_id>/rate", methods=["POST"])
def rate_task(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    task = fetch_task(task_id)

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    if task["task_state"] != "Completed":
        return jsonify({"error": "Can only rate completed tasks."}), 400

    # Verify rater is poster or performer
    if task["poster_id"] != user_id and task["performer_id"] != user_id:
        return jsonify({"error": "Only the poster or performer can rate this task."}), 403

    body = request.get_json()

    rated_id = body["rated_id"]
    reliability = int(body["reliability"])
    communication = int(body["communication"])
    timeliness = int(body["timeliness"])

    # Insert rating
    sb = get_client()
    rating_data = {
        "task_id": task_id,
        "rater_id": user_id,
        "rated_id": rated_id,
        "reliability": reliability,
        "communication": communication,
        "timeliness": timeliness
    }

    try:
        sb.table("ratings").insert(rating_data).execute()
    except Exception as e:
        return jsonify({"error": "Failed to submit rating: " + str(e)}), 400

    # Recalculate trust score for the rated user
    recalculate_trust_score(rated_id)

    return jsonify({"message": "Rating submitted."}), 201


# =====================================================================
# ROUTES — PIGGYBACK
# =====================================================================

@app.route("/api/tasks/<task_id>/piggyback", methods=["GET"])
def piggyback_tasks(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    task = fetch_task(task_id)

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    base_block = task["base_block"]
    campus_id = task["campus_id"]

    matches = find_piggyback_tasks(base_block, campus_id, user_id)

    # Exclude the current task from piggyback results
    filtered = []
    for match in matches:
        if match["task_id"] != task_id:
            filtered.append(match)

    return jsonify(filtered), 200


# =====================================================================
# ROUTES — PRICE ADVISORY
# =====================================================================

@app.route("/api/advisory/price", methods=["GET"])
def price_advisory():
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    category = request.args["category"]
    base_block = request.args["base_block"]
    target_block = request.args["target_block"]
    campus_id = request.args["campus_id"]

    result = get_price_advisory(category, base_block, target_block, campus_id)

    return jsonify(result), 200


# =====================================================================
# ROUTES — MESSAGES
# =====================================================================

@app.route("/api/messages/<task_id>", methods=["GET"])
def get_messages(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    sb = get_client()

    # Fetch messages where user is sender or receiver for this task
    result = (
        sb.table("messages")
        .select("*, sender:users!messages_sender_id_fkey(full_name), receiver:users!messages_receiver_id_fkey(full_name)")
        .eq("task_id", task_id)
        .order("created_at", desc=False)
        .execute()
    )

    # Filter to only messages where user is sender or receiver
    messages = []
    for msg in result.data:
        if msg["sender_id"] == user_id or msg["receiver_id"] == user_id:
            # Flatten sender/receiver names
            if "sender" in msg and msg["sender"] is not None:
                msg["sender_name"] = msg["sender"]["full_name"]
                del msg["sender"]
            if "receiver" in msg and msg["receiver"] is not None:
                msg["receiver_name"] = msg["receiver"]["full_name"]
                del msg["receiver"]
            messages.append(msg)

    return jsonify(messages), 200


@app.route("/api/messages/<task_id>", methods=["POST"])
def send_message(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    body = request.get_json()

    receiver_id = body["receiver_id"]
    message_body = body["body"]

    sb = get_client()

    message_data = {
        "task_id": task_id,
        "sender_id": user_id,
        "receiver_id": receiver_id,
        "body": message_body
    }

    result = sb.table("messages").insert(message_data).execute()

    return jsonify({"message_id": result.data[0]["message_id"]}), 201


# =====================================================================
# TASK DETAIL (for frontend TaskDetailPage)
# =====================================================================

@app.route("/api/tasks/<task_id>", methods=["GET"])
def get_task_detail(task_id):
    user_id, err_body, err_code = require_auth(request)
    if err_body:
        return jsonify(err_body), err_code

    task = fetch_task(task_id)

    if task is None:
        return jsonify({"error": "Task not found."}), 404

    # Only poster, performer, or published tasks visible
    if task["poster_id"] != user_id and task["performer_id"] != user_id:
        if task["task_state"] != "Published":
            return jsonify({"error": "Not authorized to view this task."}), 403

    # Join poster info
    sb = get_client()
    poster_result = sb.table("users").select("full_name, trust_score").eq("user_id", task["poster_id"]).execute()
    if len(poster_result.data) > 0:
        task["poster_full_name"] = poster_result.data[0]["full_name"]
        task["poster_trust_score"] = poster_result.data[0]["trust_score"]

    # Join performer info if assigned
    if task["performer_id"] is not None:
        performer_result = sb.table("users").select("full_name, trust_score").eq("user_id", task["performer_id"]).execute()
        if len(performer_result.data) > 0:
            task["performer_full_name"] = performer_result.data[0]["full_name"]
            task["performer_trust_score"] = performer_result.data[0]["trust_score"]

    # Remove sensitive fields
    if "completion_passcode" in task:
        del task["completion_passcode"]

    return jsonify(task), 200


# =====================================================================
# DEADLINE EXPIRY CRON
# =====================================================================

def check_expired_tasks():
    """
    Query tasks where expires_at < NOW() AND task_state = 'Published'.
    Update each to task_state = 'Expired'.
    Refund escrow for each expired task.
    """
    sb = get_client()
    now_str = datetime.now(timezone.utc).isoformat()

    result = (
        sb.table("tasks")
        .select("task_id")
        .eq("task_state", "Published")
        .eq("is_deleted", False)
        .lt("expires_at", now_str)
        .execute()
    )

    for task_row in result.data:
        tid = task_row["task_id"]
        update_task_state(tid, "Expired")
        refund_escrow(tid)


def run_expiry_loop():
    """
    Background thread that runs check_expired_tasks every 5 minutes.
    """
    while True:
        try:
            check_expired_tasks()
        except Exception as e:
            print("Expiry check error: " + str(e))
        time.sleep(300)  # 5 minutes


# =====================================================================
# ENTRY POINT
# =====================================================================

if __name__ == "__main__":
    # Start expiry cron in a background daemon thread
    expiry_thread = threading.Thread(target=run_expiry_loop, daemon=True)
    expiry_thread.start()

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
