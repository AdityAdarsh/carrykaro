from datetime import datetime, timedelta, timezone
from html import escape
from urllib.parse import urlencode

from app.config import settings
from app.services.email import send_batch
from app.services.unsubscribe_token import generate_unsubscribe_token

# Without a throttle, a user on a busy route gets re-emailed on every matching
# listing — a spam-report risk on a fresh sending domain. Skip alerts notified
# within this window; they'll pick up the next listing after it passes.
NOTIFY_COOLDOWN = timedelta(hours=24)


def notify_route_alerts(db, from_city: str, to_city: str, looking_for: str, exclude_user_id: str) -> None:
    """Email everyone who set a route alert matching a listing that was just posted.

    route_alerts.user_id references auth.users(id) directly, not public.users(id),
    so PostgREST can't embed the join — fetch alerts and users separately instead.
    """
    alerts = (
        db.table("route_alerts")
        .select("id, user_id, last_notified_at")
        .eq("from_city", from_city)
        .eq("to_city", to_city)
        .eq("looking_for", looking_for)
        .neq("user_id", exclude_user_id)
        .execute()
    )

    now = datetime.now(timezone.utc)
    due = []
    for a in alerts.data or []:
        last = a.get("last_notified_at")
        if last:
            last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
            if now - last_dt < NOTIFY_COOLDOWN:
                continue
        due.append(a)

    # A user could have more than one alert matching this route; keep one alert id
    # per user so the unsubscribe link removes a real row they subscribed to.
    alert_id_by_user = {a["user_id"]: a["id"] for a in due}
    if not alert_id_by_user:
        return

    users = db.table("users").select("id, email, name").in_("id", list(alert_id_by_user.keys())).execute()

    listing_label = "delivery request" if looking_for == "request" else "trip"
    browse_tab = "requests" if looking_for == "request" else "trips"
    query = urlencode({"tab": browse_tab, "from": from_city, "to": to_city})
    link = f"{settings.frontend_base_url}/browse?{query}"
    safe_from, safe_to = escape(from_city), escape(to_city)
    subject = f"A {listing_label} just went live on your {from_city} → {to_city} route"

    emails = []
    for u in users.data or []:
        if not u.get("email"):
            continue
        alert_id = alert_id_by_user[u["id"]]
        token = generate_unsubscribe_token(alert_id)
        unsubscribe_link = f"{settings.backend_base_url}/route-alerts/unsubscribe?token={token}"
        html = (
            f"<p>Good news — a {listing_label} matching your route alert for "
            f"<strong>{safe_from} → {safe_to}</strong> was just posted on CarryKaro.</p>"
            f"<p><a href=\"{escape(link)}\">View it on CarryKaro</a></p>"
            f"<p style=\"color:#888;font-size:12px;margin-top:24px;\">"
            f"<a href=\"{escape(unsubscribe_link)}\">Unsubscribe from this route alert</a></p>"
        )
        emails.append({"to": u["email"], "subject": subject, "html": html})

    send_batch(emails)
    notified_alert_ids = [alert_id_by_user[u["id"]] for u in users.data or [] if u.get("email")]
    if notified_alert_ids:
        db.table("route_alerts").update({"last_notified_at": now.isoformat()}).in_("id", notified_alert_ids).execute()
