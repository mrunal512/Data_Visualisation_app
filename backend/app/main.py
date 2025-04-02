from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.tasks import create_task, get_task_status, get_task_data, get_source_fields
from fastapi import Request


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/tasks")
async def create(request: Request):
    body = await request.json()
    return create_task(body)

@app.get("/tasks/{task_id}/status")
def status(task_id: str):
    return get_task_status(task_id)

@app.get("/tasks/{task_id}/data")
def data(task_id: str):
    return get_task_data(task_id)

@app.get("/api/fields")
async def get_fields():
    """Get available fields from all data sources"""
    try:
        fields = get_source_fields()
        return {
            "status": "success",
            "data": fields
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }