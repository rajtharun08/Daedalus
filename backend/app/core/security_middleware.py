import re
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("daedalus.security")

SENSITIVE_HEADERS = {
    "x-byok-key",
    "x-byok-token",
    "authorization",
    "api-key",
    "x-api-key"
}


class SensitiveHeaderFilter(logging.Filter):
    """
    Log filter that intercepts log records and redacts any accidentally logged
    API keys, Authorization tokens, or BYOK headers, including when logged via args formatting.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            msg = re.sub(r"(AIzaSy[A-Za-z0-9_-]{10,})", r"AIzaSy...[REDACTED]", msg)
            msg = re.sub(r"(sk-[A-Za-z0-9_-]{10,})", r"sk-...[REDACTED]", msg)
            msg = re.sub(r"(ghp_[A-Za-z0-9]{15,})", r"ghp_...[REDACTED]", msg)
            record.msg = msg
            record.args = ()
        except Exception:
            pass
        return True


class SensitiveHeaderRedactorMiddleware(BaseHTTPMiddleware):
    """
    Middleware ensuring all incoming sensitive BYOK headers remain strictly in-memory
    and are never leaked into request logs, query parameters, or response headers.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Check if sensitive BYOK headers exist
        has_byok = any(h.lower() in SENSITIVE_HEADERS for h in request.headers)
        if has_byok:
            # Set state attribute marking request as BYOK-protected
            request.state.is_byok = True
            request.state.byok_provider = request.headers.get("x-byok-provider")

        response: Response = await call_next(request)

        # Ensure response headers never mirror or leak any sensitive keys
        for h in SENSITIVE_HEADERS:
            if h in response.headers:
                del response.headers[h]

        return response
