"""
Application layer.

Use cases and orchestration live here. This layer may depend on the Domain
package (`easyid_domain`) and on abstract ports; it never imports from
`infrastructure/` or `api/`.
"""

from easyid_api.application.commands import Command, CommandHandler
from easyid_api.application.errors import EntityNotFound
from easyid_api.application.queries import Query, QueryHandler
from easyid_api.application.unit_of_work import UnitOfWork, UnitOfWorkFactory

__all__ = [
    "Command",
    "CommandHandler",
    "EntityNotFound",
    "Query",
    "QueryHandler",
    "UnitOfWork",
    "UnitOfWorkFactory",
]
