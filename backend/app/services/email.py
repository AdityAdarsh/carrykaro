import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

# Resend's batch endpoint accepts up to 100 emails per call
BATCH_LIMIT = 100


def send_email(to: str, subject: str, html: str) -> None:
    """Send a single email via Resend. Never raises — failures are logged and
    swallowed so a delivery problem can't break the request that triggered it."""
    send_batch([{"to": to, "subject": subject, "html": html}])


def send_batch(emails: list[dict]) -> None:
    """Send multiple emails via Resend's batch endpoint (one HTTP call per
    up-to-100 emails instead of one call per recipient). Never raises."""
    if not settings.resend_api_key or not emails:
        if not settings.resend_api_key:
            logger.warning("RESEND_API_KEY not set; skipping %d email(s)", len(emails))
        return
    for i in range(0, len(emails), BATCH_LIMIT):
        chunk = emails[i:i + BATCH_LIMIT]
        payload = [
            {"from": settings.from_email, "to": [e["to"]], "subject": e["subject"], "html": e["html"]}
            for e in chunk
        ]
        try:
            response = httpx.post(
                "https://api.resend.com/emails/batch",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json=payload,
                timeout=15,
            )
            response.raise_for_status()
        except Exception:
            logger.exception("Failed to send email batch of %d", len(chunk))
