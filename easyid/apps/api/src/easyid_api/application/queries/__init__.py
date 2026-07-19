"""
Query handlers (reads).

CQRS-lite: every read use case is a `Query` handled by a `QueryHandler`.
Queries may return lean projections rather than full domain aggregates.
"""

from easyid_api.application.queries.handler import QueryHandler, TQuery_contra, TResult_co
from easyid_api.application.queries.query import Query

__all__ = [
    "Query",
    "QueryHandler",
    "TQuery_contra",
    "TResult_co",
]
