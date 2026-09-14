import hashlib
import hmac
from typing import Optional

from app.config import settings


def generate_unsubscribe_token(alert_id: str) -> str:
    sig = hmac.new(settings.supabase_service_role_key.encode(), alert_id.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{alert_id}.{sig}"


def verify_unsubscribe_token(token: str) -> Optional[str]:
    try:
        alert_id, sig = token.rsplit(".", 1)
    except ValueError:
        return None
    expected = hmac.new(settings.supabase_service_role_key.encode(), alert_id.encode(), hashlib.sha256).hexdigest()[:32]
    if not hmac.compare_digest(sig, expected):
        return None
    return alert_id
