"""
Query handlers (reads).

CQRS-lite: every read use case lives in this package as a plain async
function or small class. Queries may return lean projections rather than
full domain entities.

Contract for every handler
--------------------------
```
async def handle(tenant: TenantContext, ..., *, uow: ...) -> Result: ...
```

- `tenant` is always the first positional argument.
- Handlers filter every persistence call by `tenant.tenant_id`.
- Handlers never read `X-Tenant-ID` (or any other HTTP concern) themselves.
"""
