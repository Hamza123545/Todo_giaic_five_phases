from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Task:
    id: int = field(init=False)
    title: str
    description: Optional[str] = None
    is_completed: bool = False

    def __post_init__(self):
        if self.description is None:
            self.description = ""
