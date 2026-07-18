"""
Identity adapters — external IdPs, JWKS fetchers, token validators.

Empty by design. Authentication lands here; tenant *resolution* (once a
principal is known) lives in `bootstrap/tenant_context.py` and is exposed
to handlers via `api/deps.py`.
"""
