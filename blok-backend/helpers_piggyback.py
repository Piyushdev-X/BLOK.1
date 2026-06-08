from db import get_client


def find_piggyback_tasks(base_block, campus_id, excluding_user_id):
    """
    Query tasks table for:
      base_block = base_block AND campus_id = campus_id
      AND task_state = 'Published'
      AND poster_id != excluding_user_id
      AND is_deleted = FALSE
      AND expires_at > NOW()
    Return list of matching task dicts.
    """
    sb = get_client()

    result = (
        sb.table("tasks")
        .select("task_id, title, reward_amount, base_block, target_block, category, expires_at")
        .eq("base_block", base_block)
        .eq("campus_id", campus_id)
        .eq("task_state", "Published")
        .eq("is_deleted", False)
        .neq("poster_id", excluding_user_id)
        .gte("expires_at", "now()")
        .execute()
    )

    return result.data
