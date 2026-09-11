import hashlib
import hmac
from typing import Optional


def verify_github_signature(payload_body: bytes, signature_header: Optional[str], secret: str) -> bool:
    """
    Verifies that the webhook payload was sent by GitHub using HMAC-SHA256.
    """
    if not signature_header or not secret:
        return False

    parts = signature_header.split("=")
    if len(parts) != 2 or parts[0] != "sha256":
        return False

    expected_signature = hmac.new(
        key=secret.encode("utf-8"),
        msg=payload_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(parts[1], expected_signature)
