"""
Models package for Todo backend application.

This package contains all SQLModel database models.
"""

# Import models from parent models.py file using importlib
import importlib.util
import sys
from pathlib import Path

# Load User and Task from root models.py file
models_file_path = Path(__file__).parent.parent / "models.py"
spec = importlib.util.spec_from_file_location("root_models", models_file_path)
if spec and spec.loader:
    root_models = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(root_models)
    User = root_models.User
    Task = root_models.Task
else:
    raise ImportError("Could not load models.py from parent directory")

# Import from models/ package subdirectories
from models.conversation import Conversation  # type: ignore
from models.message import Message  # type: ignore

__all__ = ["User", "Task", "Conversation", "Message"]
