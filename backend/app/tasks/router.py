from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.auth.auth import get_current_active_user
from app.auth.models import User
from app.tasks.models import Task
from app.tasks.schemas import TaskCreate, TaskUpdate, Task as TaskSchema

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/", response_model=TaskSchema)
def create_task(
    task: TaskCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_task = Task(
        **task.model_dump(),
        owner_id=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.post("/list", response_model=List[TaskSchema])
def read_tasks(
    skip: int = 0, 
    limit: int = 100,
    completed: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Task).filter(Task.owner_id == current_user.id)
    
    if completed is not None:
        query = query.filter(Task.completed == completed)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.post("/{task_id}/get", response_model=TaskSchema)
def read_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(Task).filter(
        Task.id == task_id, 
        Task.owner_id == current_user.id
    ).first()
    
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task

@router.post("/{task_id}/update", response_model=TaskSchema)
def update_task(
    task_id: int, 
    task_update: TaskUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_task = db.query(Task).filter(
        Task.id == task_id, 
        Task.owner_id == current_user.id
    ).first()
    
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db_task.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_task)
    
    return db_task

@router.post("/{task_id}/delete")
def delete_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_task = db.query(Task).filter(
        Task.id == task_id, 
        Task.owner_id == current_user.id
    ).first()
    
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    
    return {"message": "Task deleted successfully"}