"""Command handler port — executes a single write use case."""

from __future__ import annotations

from typing import Protocol, TypeVar

from easyid_api.application.commands.command import Command

TCommand_contra = TypeVar("TCommand_contra", bound=Command, contravariant=True)
TResult_co = TypeVar("TResult_co", covariant=True)


class CommandHandler(Protocol[TCommand_contra, TResult_co]):
    """
    Async handler for one command type.

    Application use cases implement this Protocol. The HTTP layer and any
    future bus/mediator depend on it — never on FastAPI, SQLAlchemy, or
    infrastructure types.
    """

    async def handle(self, command: TCommand_contra) -> TResult_co:
        """Execute the write use case for `command` and return its result."""
        ...
