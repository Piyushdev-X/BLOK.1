from db import get_client


def require_auth(request):
    """
    Extract and validate the Bearer token from the request.
    Returns a tuple: (user_id, error_body, error_code)
    If valid:   (user_uuid_string, None, None)
    If invalid: (None, {"error": "..."}, 401)
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return (None, {"error": "Missing or malformed Authorization header."}, 401)

    token = auth_header[len("Bearer "):]

    if not token:
        return (None, {"error": "Token is empty."}, 401)

    sb = get_client()

    try:
        user_response = sb.auth.get_user(token)
    except Exception:
        return (None, {"error": "Unauthorized. Invalid or expired token."}, 401)

    if user_response is None or user_response.user is None:
        return (None, {"error": "Unauthorized. Could not resolve user."}, 401)

    user_id = str(user_response.user.id)
    return (user_id, None, None)


def validate_institution_email(email):
    """
    Check if the institution email ends with an approved domain.
    Returns True if valid, False otherwise.
    """
    approved_domains = ["edu.in", "ac.in", "edu"]
    domain_part = email.split("@")[-1]

    is_valid = False
    for domain in approved_domains:
        if domain_part.endswith(domain):
            is_valid = True
            break

    return is_valid
