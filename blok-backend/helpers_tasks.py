from db import get_client


def fetch_task(task_id):
    """
    Fetch a single task by task_id.
    Returns the task dict or None if not found.
    """
    sb = get_client()
    result = sb.table("tasks").select("*").eq("task_id", task_id).execute()

    if len(result.data) == 0:
        return None

    return result.data[0]


def fetch_tasks_for_feed(campus_id, user_id):
    """
    Fetch published, non-deleted, non-expired tasks for a campus,
    excluding the user's own tasks. Ordered by created_at DESC.
    Joins poster trust_score and full_name.
    """
    sb = get_client()
    result = (
        sb.table("tasks")
        .select("*, users!tasks_poster_id_fkey(full_name, trust_score)")
        .eq("campus_id", campus_id)
        .eq("task_state", "Published")
        .eq("is_deleted", False)
        .neq("poster_id", user_id)
        .gte("expires_at", "now()")
        .order("created_at", desc=True)
        .execute()
    )

    return result.data


def update_task_state(task_id, new_state):
    """
    Update the task_state for a given task.
    Returns the updated task dict.
    """
    sb = get_client()
    result = (
        sb.table("tasks")
        .update({"task_state": new_state})
        .eq("task_id", task_id)
        .execute()
    )

    if len(result.data) == 0:
        return None

    return result.data[0]


def assign_performer(task_id, performer_id):
    """
    Set the performer_id and update task_state to Accepted.
    """
    sb = get_client()
    result = (
        sb.table("tasks")
        .update({"performer_id": performer_id, "task_state": "Accepted"})
        .eq("task_id", task_id)
        .execute()
    )

    if len(result.data) == 0:
        return None

    return result.data[0]


def set_proof_photo(task_id, proof_photo_url):
    """
    Update the proof_photo_url for a task.
    """
    sb = get_client()
    sb.table("tasks").update({"proof_photo_url": proof_photo_url}).eq("task_id", task_id).execute()


def fetch_user_task_counts(user_id):
    """
    Return counts of tasks posted and tasks completed by a user.
    """
    sb = get_client()

    posted_result = (
        sb.table("tasks")
        .select("task_id", count="exact")
        .eq("poster_id", user_id)
        .eq("is_deleted", False)
        .execute()
    )

    completed_result = (
        sb.table("tasks")
        .select("task_id", count="exact")
        .eq("performer_id", user_id)
        .eq("task_state", "Completed")
        .eq("is_deleted", False)
        .execute()
    )

    posted_count = posted_result.count if posted_result.count is not None else 0
    completed_count = completed_result.count if completed_result.count is not None else 0

    return {"tasks_posted": posted_count, "tasks_completed": completed_count}
