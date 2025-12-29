"""
Background tasks module for Todo backend.

This module contains scheduled background tasks for:
- Message cleanup (2-day retention policy)
- Database maintenance
- Performance optimization
"""

from tasks.message_cleanup import cleanup_expired_messages

__all__ = ["cleanup_expired_messages"]
