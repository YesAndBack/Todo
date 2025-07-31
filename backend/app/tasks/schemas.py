from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# Базовая схема для задачи
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    due_date: Optional[datetime] = None

# Схема для создания задачи
class TaskCreate(TaskBase):
    pass

# Схема для обновления задачи
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    due_date: Optional[datetime] = None

# Схема для вывода задачи
class Task(TaskBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True