import uuid
import threading
from app.models import SessionLocal, Task, Record
from app.job_queue import job_queue
from app.utils.music_festivals import load_music_festivals
from app.utils.transport_ridership import load_transport_ridership
from app.filters import apply_filters


def create_task(body):
    filters = body.get("filters", [])
    print("📦 Filters received:", filters)
    task_id = str(uuid.uuid4())

    db = SessionLocal()
    task = Task(id=task_id, status="pending")
    db.add(task)
    db.commit()
    db.close()

    def process():
        db = SessionLocal()
        task = db.query(Task).filter(Task.id == task_id).first()
        task.status = "in_progress"
        db.commit()

        data_festivals = load_music_festivals()
        data_transport = load_transport_ridership()
        print("Music Festivals:", len(data_festivals))
        print("Transport Records:", len(data_transport))

        records = apply_filters(data_festivals + data_transport, filters)
        print("Filtered records:", len(records))

        for row in records:
            db.add(Record(task_id=task_id, data=row))

        db.flush()
        db.commit()
        print("✅ Records committed:", len(records))
        task.status = "completed"
        db.commit()
        db.close()


    job_queue.append(threading.Thread(target=process))
    job_queue[-1].start()

    return {"task_id": task_id}


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
    """Extract fields from both data sources"""
    # Load data from both sources
    festivals_data = load_music_festivals()
    transport_data = load_transport_ridership()

    # Extract fields from first record of each source
    festival_fields = list(festivals_data[0].keys()) if festivals_data else []
    transport_fields = list(transport_data[0].keys()) if transport_data else []

    # Create source-specific field mappings
    fields = {
        "source_a": festival_fields,
        "source_b": transport_fields,
        "common": list(set(festival_fields) & set(transport_fields))
    }

    return fields