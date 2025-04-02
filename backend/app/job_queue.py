from queue import Queue, Empty
from threading import Thread
import time
from datetime import datetime
from .models import SessionLocal, Task, Record
from .utils.music_festivals import load_music_festivals
from .utils.transport_ridership import load_transport_ridership

class JobQueue:
    def __init__(self):
        self.queue = Queue()
        self.processing = False

    def start_processing(self):
        if not self.processing:
            self.processing = True
            Thread(target=self._process_queue, daemon=True).start()
            print("Job queue processing started")

    def add_task(self, task_id):
        print(f"Adding task {task_id} to queue")
        self.queue.put(task_id)

    def _process_queue(self):
        while self.processing:
            try:
                task_id = self.queue.get(timeout=1)
                print(f"⚙️ Processing task {task_id}")
                self._process_task(task_id)
                self.queue.task_done()
            except Empty:
                continue
            except Exception as e:
                print(f"Error processing queue: {str(e)}")

    def _process_task(self, task_id):
        db = SessionLocal()
        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                return

            
            print(f"⏳ Task {task_id} waiting to start...")
            time.sleep(5)
            
            
            task.status = "in_progress"
            task.updated_at = datetime.utcnow()
            db.commit()
            print(f"Task {task_id} in progress")

            
            all_data = []
            festivals = load_music_festivals()
            transport = load_transport_ridership()
            
            for item in festivals:
                item['source'] = 'source_a'
                all_data.append(item)
            
            for item in transport:
                item['source'] = 'source_b'
                all_data.append(item)

            
            print(f"Task {task_id} processing...")
            time.sleep(5)

           
            if task.filters:
                filtered_data = []
                for item in all_data:
                    matches = True
                    for filter_item in task.filters:
                        field = filter_item.get('field')
                        operator = filter_item.get('operator')
                        value = filter_item.get('value')

                        if operator == 'in':
                            if str(item.get(field, '')).lower() != str(value).lower():
                                matches = False
                                break
                        elif operator == 'between' and field == 'date':
                            start_date, end_date = value.split(',')
                            if not (start_date <= item.get('date', '') <= end_date):
                                matches = False
                                break

                    if matches:
                        filtered_data.append(item)
            else:
                filtered_data = all_data

            for item in filtered_data:
                record = Record(
                    task_id=task_id,
                    source=item['source'],
                    data=item
                )
                db.add(record)

            task.status = "completed"
            task.updated_at = datetime.utcnow()
            db.commit()
            print(f"Task {task_id} completed")

        except Exception as e:
            print(f"Task {task_id} failed: {str(e)}")
            task.status = "failed"
            task.updated_at = datetime.utcnow()
            db.commit()

        finally:
            db.close()


job_queue = JobQueue()