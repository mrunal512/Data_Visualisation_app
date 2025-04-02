from sqlalchemy import Column, String, Integer, JSON, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()
engine = create_engine("sqlite:///../db.sqlite3")
SessionLocal = sessionmaker(bind=engine)


class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    status = Column(String)
    records = relationship("Record", back_populates="task")


class Record(Base):
    __tablename__ = "records"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("tasks.id"))
    data = Column(JSON)  # Store any structure

    task = relationship("Task", back_populates="records")

    def to_dict(self):
        return self.data


Base.metadata.create_all(bind=engine)
