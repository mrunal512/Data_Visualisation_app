from sqlalchemy import Column, String, Integer, JSON, ForeignKey, create_engine, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()
engine = create_engine("sqlite:///../db.sqlite3")
SessionLocal = sessionmaker(bind=engine)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    status = Column(String)
    sources = Column(JSON)  
    filters = Column(JSON)  
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    records = relationship("Record", back_populates="task")

class Record(Base):
    __tablename__ = "records"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("tasks.id"))
    source = Column(String)  
    data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    task = relationship("Task", back_populates="records")

    def to_dict(self):
        return {**self.data, "source": self.source}

Base.metadata.create_all(bind=engine)
