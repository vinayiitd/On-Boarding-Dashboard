"""
Command handlers (writes).

CQRS-lite: every write use case lives in this package as a plain async
function or small class. No FastAPI types, no SQLAlchemy sessions as
implicit globals.

Contract for every handler
--------------------------
```
async def handle(tenant: TenantContext, ..., *, uow: ...) -> Result: ...
```

- `tenant` is always the first positional argument.
- Handlers filter every persistence call by `tenant.tenant_id`.
- Handlers never read `X-Tenant-ID` (or any other HTTP concern) themselves.
"""
