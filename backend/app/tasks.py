import uuid
import threading
from datetime import datetime
from app.models import SessionLocal, Task, Record
from app.job_queue import job_queue
from app.utils.music_festivals import load_music_festivals
from app.utils.transport_ridership import load_transport_ridership
from app.filters import apply_filters


def create_task(body):
    """Create a new data processing task"""
    filters = body.get("filters", [])
    print("📦 Filters received:", filters)
    task_id = str(uuid.uuid4())

    db = SessionLocal()
    try:
        
        task = Task(
            id=task_id,
            status="pending",
            filters=filters,
            created_at=datetime.utcnow()
        )
        db.add(task)
        db.commit()
        
        
        job_queue.add_task(task_id)
        
        return {
            "task_id": task_id,
            "status": "pending",
            "message": "Task queued successfully"
        }
    finally:
        db.close()


def get_task_status(task_id):
    db = SessionLocal()
    task = db.query(Task).filter(Task.id == task_id).first()
    db.close()
    return {"status": task.status if task else "not_found"}


def get_task_data(task_id):
    db = SessionLocal()
    records = db.query(Record).filter(Record.task_id == task_id).all()
    print("Records fetched from DB:", [r.data for r in records])
    db.close()
    return {"records": [r.to_dict() for r in records]}


def get_source_fields():
    
    festivals_data = load_music_festivals()
    transport_data = load_transport_ridership()

    festival_fields = list(festivals_data[0].keys()) if festivals_data else []
    transport_fields = list(transport_data[0].keys()) if transport_data else []

    fields = {
        "source_a": festival_fields,
        "source_b": transport_fields,
        "common": list(set(festival_fields) & set(transport_fields))
    }

    return fields