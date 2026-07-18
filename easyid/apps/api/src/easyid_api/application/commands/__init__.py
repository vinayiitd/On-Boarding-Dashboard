"""
Command handlers (writes).

CQRS-lite: every write use case lives in this package as a plain async
function or small class. No FastAPI types, no sessions as implicit globals.

Empty in FND-002. When the first write use case lands, handlers take an
explicit tenant context (once tenancy is introduced) as their first
positional argument and never read HTTP concerns themselves.
"""
