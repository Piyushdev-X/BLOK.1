from db import get_client


def recalculate_trust_score(user_id):
    """
    Fetch all ratings rows where rated_id = user_id.
    Calculate a new trust_score:
      avg_reliability    = sum of all reliability values / count
      avg_communication  = sum of all communication values / count
      avg_timeliness     = sum of all timeliness values / count
      raw_score = (avg_reliability + avg_communication + avg_timeliness) / 3
      Clamp raw_score to range [1.0, 5.0].
    Update users.trust_score for user_id.
    """
    sb = get_client()

    ratings_result = sb.table("ratings").select("*").eq("rated_id", user_id).execute()

    if len(ratings_result.data) == 0:
        return

    ratings = ratings_result.data
    count = len(ratings)

    total_reliability = 0
    total_communication = 0
    total_timeliness = 0

    for rating in ratings:
        total_reliability = total_reliability + int(rating["reliability"])
        total_communication = total_communication + int(rating["communication"])
        total_timeliness = total_timeliness + int(rating["timeliness"])

    avg_reliability = total_reliability / count
    avg_communication = total_communication / count
    avg_timeliness = total_timeliness / count

    raw_score = (avg_reliability + avg_communication + avg_timeliness) / 3.0

    # Clamp to [1.0, 5.0]
    clamped_score = max(1.0, min(5.0, raw_score))

    # Round to 1 decimal place
    clamped_score = round(clamped_score, 1)

    sb.table("users").update({
        "trust_score": clamped_score
    }).eq("user_id", user_id).execute()


def apply_abandonment_penalty(user_id):
    """
    Fetch current trust_score for user_id.
    Subtract 0.5 from trust_score.
    Clamp result to minimum 1.0.
    Update users.trust_score.
    """
    sb = get_client()

    user_result = sb.table("users").select("trust_score").eq("user_id", user_id).execute()

    if len(user_result.data) == 0:
        return

    current_score = float(user_result.data[0]["trust_score"])
    new_score = current_score - 0.5

    # Clamp to minimum 1.0
    new_score = max(1.0, new_score)
    new_score = round(new_score, 1)

    sb.table("users").update({
        "trust_score": new_score
    }).eq("user_id", user_id).execute()
