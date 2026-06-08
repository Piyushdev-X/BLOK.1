from db import get_client
from datetime import datetime, timezone


def release_escrow(task_id):
    """
    Fetch escrow row for task_id.
    Set escrow status = 'released', resolved_at = NOW().
    Add escrow amount to the performer's wallet_balance.
    """
    sb = get_client()

    escrow_result = sb.table("escrow").select("*").eq("task_id", task_id).execute()

    if len(escrow_result.data) == 0:
        return None

    escrow_row = escrow_result.data[0]
    performer_id = escrow_row["performer_id"]
    amount = float(escrow_row["amount"])

    # Update escrow status
    now_str = datetime.now(timezone.utc).isoformat()
    sb.table("escrow").update({
        "status": "released",
        "resolved_at": now_str
    }).eq("escrow_id", escrow_row["escrow_id"]).execute()

    # Add amount to performer's wallet
    performer_result = sb.table("users").select("wallet_balance").eq("user_id", performer_id).execute()
    current_balance = float(performer_result.data[0]["wallet_balance"])
    new_balance = current_balance + amount

    sb.table("users").update({
        "wallet_balance": new_balance
    }).eq("user_id", performer_id).execute()

    return {"status": "released", "amount": amount, "performer_id": performer_id}


def apply_penalty(task_id):
    """
    Fetch escrow row for task_id.
    Calculate 50% of escrow amount.
    Deduct that amount from the performer's wallet_balance
    (wallet floor is 0, never go negative).
    Set escrow status = 'penalised'.
    """
    sb = get_client()

    escrow_result = sb.table("escrow").select("*").eq("task_id", task_id).execute()

    if len(escrow_result.data) == 0:
        return None

    escrow_row = escrow_result.data[0]
    performer_id = escrow_row["performer_id"]
    amount = float(escrow_row["amount"])
    penalty_amount = amount * 0.5

    # Update escrow status
    now_str = datetime.now(timezone.utc).isoformat()
    sb.table("escrow").update({
        "status": "penalised",
        "resolved_at": now_str
    }).eq("escrow_id", escrow_row["escrow_id"]).execute()

    # Deduct penalty from performer's wallet (floor at 0)
    performer_result = sb.table("users").select("wallet_balance").eq("user_id", performer_id).execute()
    current_balance = float(performer_result.data[0]["wallet_balance"])
    new_balance = max(0, current_balance - penalty_amount)

    sb.table("users").update({
        "wallet_balance": new_balance
    }).eq("user_id", performer_id).execute()

    return {"status": "penalised", "penalty_amount": penalty_amount}


def refund_escrow(task_id):
    """
    Return held escrow funds to the poster's wallet.
    Set escrow status = 'refunded'.
    """
    sb = get_client()

    escrow_result = sb.table("escrow").select("*").eq("task_id", task_id).execute()

    if len(escrow_result.data) == 0:
        return None

    escrow_row = escrow_result.data[0]
    poster_id = escrow_row["poster_id"]
    amount = float(escrow_row["amount"])

    # Update escrow status
    now_str = datetime.now(timezone.utc).isoformat()
    sb.table("escrow").update({
        "status": "refunded",
        "resolved_at": now_str
    }).eq("escrow_id", escrow_row["escrow_id"]).execute()

    # Refund amount to poster's wallet
    poster_result = sb.table("users").select("wallet_balance").eq("user_id", poster_id).execute()
    current_balance = float(poster_result.data[0]["wallet_balance"])
    new_balance = current_balance + amount

    sb.table("users").update({
        "wallet_balance": new_balance
    }).eq("user_id", poster_id).execute()

    return {"status": "refunded", "amount": amount, "poster_id": poster_id}
