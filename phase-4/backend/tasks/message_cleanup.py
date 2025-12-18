"""
Background tasks for message cleanup and maintenance.

This module provides background tasks for:
- Cleaning up expired messages (2-day retention policy)
- Archiving old conversations
- Performance maintenance
"""

import logging
from datetime import datetime

from sqlmodel import Session, select

from db import engine
from models import Message

logger = logging.getLogger(__name__)


def cleanup_expired_messages() -> dict:
    """
    Clean up expired messages (2-day retention policy).

    This task:
    1. Finds all messages with expires_at < now()
    2. Deletes expired messages
    3. Logs cleanup statistics

    This should be run periodically (recommended: daily at off-peak hours)

    Returns:
        dict: Cleanup statistics including:
            - deleted_count: Number of messages deleted
            - timestamp: When cleanup was executed
    """
    with Session(engine) as session:
        try:
            now = datetime.utcnow()

            # Query for expired messages
            statement = select(Message).where(Message.expires_at < now)
            expired_messages = session.exec(statement).all()

            deleted_count = len(expired_messages)

            if deleted_count > 0:
                # Delete expired messages
                for message in expired_messages:
                    session.delete(message)

                session.commit()
                logger.info(
                    f"Message cleanup completed: deleted {deleted_count} expired messages "
                    f"at {now.isoformat()}"
                )
            else:
                logger.debug(
                    f"Message cleanup completed: no expired messages found at {now.isoformat()}"
                )

            return {
                "success": True,
                "deleted_count": deleted_count,
                "timestamp": now.isoformat(),
            }

        except Exception as e:
            logger.error(f"Error during message cleanup: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
