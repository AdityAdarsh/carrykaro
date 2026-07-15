from html import escape
from urllib.parse import urlencode

from app.config import settings
from app.services.email import send_batch


def notify_route_alerts(db, from_city: str, to_city: str, looking_for: str, exclude_user_id: str) -> None:
    """Email everyone who set a route alert matching a listing that was just posted.

    route_alerts.user_id references auth.users(id) directly, not public.users(id),
    so PostgREST can't embed the join — fetch alerts and users separately instead.
    """
    alerts = (
        db.table("route_alerts")
        .select("user_id")
        .eq("from_city", from_city)
        .eq("to_city", to_city)
        .eq("looking_for", looking_for)
        .neq("user_id", exclude_user_id)
        .execute()
    )
    recipient_ids = list({a["user_id"] for a in (alerts.data or [])})
    if not recipient_ids:
        return

    users = db.table("users").select("id, email, name").in_("id", recipient_ids).execute()

    listing_label = "delivery request" if looking_for == "request" else "trip"
    browse_tab = "requests" if looking_for == "request" else "trips"
    query = urlencode({"tab": browse_tab, "from": from_city, "to": to_city})
    link = f"{settings.frontend_base_url}/browse?{query}"
    safe_from, safe_to = escape(from_city), escape(to_city)
    subject = f"A {listing_label} just went live on your {from_city} → {to_city} route"
    html = (
        f"<p>Good news — a {listing_label} matching your route alert for "
        f"<strong>{safe_from} → {safe_to}</strong> was just posted on CarryKaro.</p>"
        f"<p><a href=\"{escape(link)}\">View it on CarryKaro</a></p>"
    )

    emails = [{"to": u["email"], "subject": subject, "html": html} for u in (users.data or []) if u.get("email")]
    send_batch(emails)
