"""
In-memory store implementation for ChatKit.

This provides a simple in-memory storage for threads and messages.
For production, replace with a persistent database store.
"""

import uuid
from typing import Any

from chatkit.server import (
    Store,
    ThreadMetadata,
    ThreadItem,
    Page,
    StoreItemType as ThreadItemTypes,
)


class MemoryStore(Store):
    """Simple in-memory store for ChatKit threads and items."""

    def __init__(self):
        """Initialize empty storage."""
        self._threads: dict[str, ThreadMetadata] = {}
        self._items: dict[str, list[ThreadItem]] = {}
        self._attachments: dict[str, Any] = {}

    async def save_thread(
        self,
        thread: ThreadMetadata,
        context: Any,
    ) -> None:
        """Save or update a thread."""
        self._threads[thread.id] = thread

    async def load_thread(
        self,
        thread_id: str,
        context: Any,
    ) -> ThreadMetadata | None:
        """Load a thread by ID, creating it if it doesn't exist."""
        if thread_id not in self._threads:
            # Create new thread if it doesn't exist
            from datetime import datetime
            thread = ThreadMetadata(
                id=thread_id,
                created_at=datetime.now(),
            )
            self._threads[thread_id] = thread
        return self._threads[thread_id]

    async def load_threads(
        self,
        limit: int,
        after: str | None,
        order: str,
        context: Any,
    ) -> Page[ThreadMetadata]:
        """Load all threads with pagination."""
        threads = list(self._threads.values())
        return Page(
            data=threads[-limit:] if limit else threads,
            has_more=False,
            after=None,
        )

    async def delete_thread(
        self,
        thread_id: str,
        context: Any,
    ) -> None:
        """Delete a thread and all its items."""
        if thread_id in self._threads:
            del self._threads[thread_id]
        if thread_id in self._items:
            del self._items[thread_id]

    async def load_thread_items(
        self,
        thread_id: str,
        after: str | None,
        limit: int,
        order: str,
        context: Any,
    ) -> Page[ThreadItem]:
        """Load items (messages, widgets) for a thread."""
        items = self._items.get(thread_id, [])
        return Page(
            data=items[-limit:] if limit else items,
            has_more=False,
            after=None,
        )

    async def add_thread_item(
        self,
        thread_id: str,
        item: ThreadItem,
        context: Any,
    ) -> None:
        """Add a thread item (message, widget, etc.)."""
        if thread_id not in self._items:
            self._items[thread_id] = []
        self._items[thread_id].append(item)

    async def save_item(
        self,
        thread_id: str,
        item: ThreadItem,
        context: Any,
    ) -> None:
        """Save/update a thread item."""
        if thread_id not in self._items:
            self._items[thread_id] = []

        # Update existing item or append new one
        items = self._items[thread_id]
        for i, existing in enumerate(items):
            if existing.id == item.id:
                items[i] = item
                return
        items.append(item)

    async def load_item(
        self,
        thread_id: str,
        item_id: str,
        context: Any,
    ) -> ThreadItem:
        """Load a single item by ID."""
        items = self._items.get(thread_id, [])
        for item in items:
            if item.id == item_id:
                return item
        raise ValueError(f"Item {item_id} not found in thread {thread_id}")

    async def delete_thread_item(
        self,
        thread_id: str,
        item_id: str,
        context: Any,
    ) -> None:
        """Delete a thread item."""
        if thread_id in self._items:
            self._items[thread_id] = [
                item for item in self._items[thread_id]
                if item.id != item_id
            ]

    async def save_attachment(
        self,
        attachment: Any,
        context: Any,
    ) -> None:
        """Save an attachment (file or image)."""
        self._attachments[attachment.id] = attachment

    async def load_attachment(
        self,
        attachment_id: str,
        context: Any,
    ) -> Any:
        """Load an attachment by ID."""
        attachment = self._attachments.get(attachment_id)
        if not attachment:
            raise ValueError(f"Attachment {attachment_id} not found")
        return attachment

    async def delete_attachment(
        self,
        attachment_id: str,
        context: Any,
    ) -> None:
        """Delete an attachment."""
        if attachment_id in self._attachments:
            del self._attachments[attachment_id]

    def generate_thread_id(self, context: Any) -> str:
        """Generate a unique thread ID."""
        return str(uuid.uuid4())

    def generate_item_id(
        self,
        item_type: ThreadItemTypes,
        thread: ThreadMetadata,
        context: Any,
    ) -> str:
        """Generate a unique item ID."""
        return str(uuid.uuid4())
