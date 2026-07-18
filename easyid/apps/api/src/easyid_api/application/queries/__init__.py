"""
Query handlers (reads).

CQRS-lite: every read use case lives in this package as a plain async
function or small class. Queries may return lean projections rather than
full domain entities.

Empty in FND-002. When the first read use case lands, handlers follow the
same explicit-tenant contract as commands (once tenancy is introduced).
"""
