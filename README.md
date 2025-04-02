# Data Visualization Application

## Overview
A full-stack web application for analyzing and visualizing data from multiple sources, featuring asynchronous task processing and interactive D3.js charts.

## Datasets

### Music Festivals (Source A)
- **Format**: JSON
- **Fields**:
  - name: Festival name
  - location: Event venue
  - date: Event date (YYYY-MM-DD)
  - music_genre: Type of music
  - attendance: Number of attendees

### Transport Ridership (Source B)
- **Format**: CSV
- **Fields**:
  - name: Station name
  - location: City
  - date: Record date (YYYY-MM-DD)
  - transport_mode: Type of transport
  - daily_riders: Daily passenger count

## Features

### Task Processing
- Asynchronous task handling with status tracking
- Status transitions with simulated delays:
  1. "pending" (initial)
  2. "in_progress" (after 5s)
  3. "completed"/"failed" (after processing)

### Data Filtering
- Date range selection
- Location-based filtering
- Source-specific filters

### Job Queue
- In-memory queue implementation
- Thread-based task processing
- Simulated processing delays for real-world scenarios

## Project Structure

```
project/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── models.py         # Database models
│   │   ├── tasks.py          # Task processing
│   │   └── job_queue.py      # Queue implementation
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── TaskCreation/
    │   │   └── Visualization/
    │   └── App.jsx
    └── package.json
```

## API Endpoints

### Task Management
- `POST /tasks` - Create new task
- `GET /tasks/{task_id}/status` - Check task status
- `GET /tasks/{task_id}/data` - Get processed data
- `GET /api/fields` - Get available fields

## Setup Instructions

### Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

## Usage Examples

### Creating a Task
```json
POST tasks
{
  "filters": [
    {
      "field": "location",
      "operator": "in",
      "value": "portland"
    },
    {
      "field": "date",
      "operator": "between",
      "value": "2024-01-01,2024-12-31"
    }
  ]
}
```

### Checking Task Status
```json
GET /tasks/{task_id}/status
{
  "status": "completed",
  "created_at": "2024-04-02T14:54:54",
  "updated_at": "2024-04-02T14:55:04"
}
```

## Technologies Used

### Backend
- FastAPI - Web framework
- SQLAlchemy - ORM
- SQLite - Database
- Python Queue - Job processing

### Frontend
- React/Vite - UI framework
- D3.js - Data visualization
- TailwindCSS - Styling
- Axios - API client

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm/yarn
- SQLite




