"""
Infrastructure layer.

Concrete implementations of ports — databases, HTTP clients, message queues,
etc. May import SQLAlchemy, boto3, or any external library, but must not
import from `api/`.
"""
