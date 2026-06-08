from db import get_client
from datetime import datetime, timezone, timedelta


def get_price_advisory(category, base_block, target_block, campus_id):
    """
    Query task_price_history table for records matching:
      campus_id, base_block, target_block, category
    where recorded_at > (NOW() - 30 days).

    If 0 records found: return no-data response.
    If records found: calculate average and return advisory message.
    """
    sb = get_client()

    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    result = (
        sb.table("task_price_history")
        .select("reward_amount")
        .eq("campus_id", campus_id)
        .eq("base_block", base_block)
        .eq("target_block", target_block)
        .eq("category", category)
        .gte("recorded_at", thirty_days_ago)
        .execute()
    )

    if len(result.data) == 0:
        return {
            "suggested_price": None,
            "message": "No pricing data yet for this route."
        }

    records = result.data
    total = 0
    for record in records:
        total = total + float(record["reward_amount"])

    average = total / len(records)
    average = round(average, 2)

    message = (
        "Similar tasks are converting fast at "
        "\u20b9" + str(int(average)) + ". "
        "Adjusting your offer optimises matching."
    )

    return {
        "suggested_price": average,
        "message": message
    }
