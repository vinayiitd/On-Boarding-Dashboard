"""Query handler port — executes a single read use case."""

from __future__ import annotations

from typing import Protocol, TypeVar

from easyid_api.application.queries.query import Query

TQuery_contra = TypeVar("TQuery_contra", bound=Query, contravariant=True)
TResult_co = TypeVar("TResult_co", covariant=True)


class QueryHandler(Protocol[TQuery_contra, TResult_co]):
    """
    Async handler for one query type.

    Handlers may return lean projections rather than full domain aggregates.
    No FastAPI, SQLAlchemy, or infrastructure types appear in the signature.
    """

    async def handle(self, query: TQuery_contra) -> TResult_co:
        """Execute the read use case for `query` and return its result."""
        ...
