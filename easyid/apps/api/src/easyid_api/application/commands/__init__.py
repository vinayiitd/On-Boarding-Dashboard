"""
Command handlers (writes).

CQRS-lite: every write use case is a `Command` handled by a
`CommandHandler`. No FastAPI types, no sessions as implicit globals.
"""

from easyid_api.application.commands.command import Command
from easyid_api.application.commands.handler import (
    CommandHandler,
    TCommand_contra,
    TResult_co,
)

__all__ = [
    "Command",
    "CommandHandler",
    "TCommand_contra",
    "TResult_co",
]
