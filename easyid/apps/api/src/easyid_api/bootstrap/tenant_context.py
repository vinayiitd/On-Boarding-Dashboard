"""
Tenant isolation context.

Every tenant-scoped application service (command or query) receives a
`TenantContext` as an explicit argument. The API resolves the tenant
**once per request** in `api/deps.py` and passes the resulting context
down — handlers never re-resolve, never trust a raw client-supplied
tenant id outside of this object, and never fall back to a global
"current tenant".

Isolation strategy (row-level, shared schema): every persistence query
that touches tenant data must filter on `tenant_id`. The context is the
sole carrier of that id into the application layer.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class TenantContext:
    """
    Immutable per-request tenant scope.

    Attributes:
        tenant_id: Stable identifier for the tenant. Opaque to handlers —
            do not parse or invent structure inside application code.
    """

    tenant_id: str

    def __post_init__(self) -> None:
        if not self.tenant_id or not self.tenant_id.strip():
            raise ValueError("TenantContext.tenant_id must be a non-empty string")
