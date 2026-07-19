"""
Unit of Work port (compatibility re-export).

Canonical definition: `easyid_api.application.unit_of_work`.
"""

from __future__ import annotations

from easyid_api.application.unit_of_work import UnitOfWork, UnitOfWorkFactory

__all__ = ["UnitOfWork", "UnitOfWorkFactory"]
