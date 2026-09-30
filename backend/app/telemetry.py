"""Optional Sentry instrumentation; ordinary local installs need no SDK."""
import os


def initialize():
    if not os.getenv("SENTRY_DSN"):
        return None
    import sentry_sdk

    def scrub(event, hint):
        request = event.get("request", {})
        for field in ("headers", "cookies", "data", "query_string"):
            request.pop(field, None)
        event.pop("user", None)
        return event

    sentry_sdk.init(
        dsn=os.environ["SENTRY_DSN"],
        environment=os.getenv("APP_ENV", "development"),
        release=os.getenv("APP_RELEASE"),
        send_default_pii=False,
        traces_sample_rate=0.05,
        before_send=scrub,
    )
    return sentry_sdk
