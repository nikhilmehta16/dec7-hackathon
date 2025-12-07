import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Medical Reports API")

# Add CORS middleware to allow requests from the frontend (usually running on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev purposes, allow all. In prod, specify the frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASETS_DIR = os.path.join(os.path.dirname(__file__), 'datasets')
REPORTS_SUMMARY_FILE = os.path.join(DATASETS_DIR, 'reports_summary.json')
DOCTORS_FILE = os.path.join(DATASETS_DIR, 'doctors.json')
APPOINTMENTS_FILE = os.path.join(DATASETS_DIR, 'appointments.json')

def _load_reports_summary():
    if not os.path.exists(REPORTS_SUMMARY_FILE):
        return []
    try:
        with open(REPORTS_SUMMARY_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def _load_doctors():
    if not os.path.exists(DOCTORS_FILE):
        return {}
    try:
        with open(DOCTORS_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def _load_appointments():
    if not os.path.exists(APPOINTMENTS_FILE):
        return []
    try:
        with open(APPOINTMENTS_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

@app.get("/reports")
async def list_reports():
    """Lists all available medical report summaries."""
    summaries = _load_reports_summary()
    return JSONResponse(content={"status": "success", "reports": summaries})

@app.get("/reports/{filename}")
async def get_report_detail(filename: str):
    """Retrieves the full content of a specific report."""
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(DATASETS_DIR, safe_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report not found")
        
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        return JSONResponse(content={"status": "success", "filename": safe_filename, "content": content})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/doctors")
async def list_doctors():
    """Lists all available doctors."""
    doctors = _load_doctors()
    return JSONResponse(content=doctors)

@app.get("/appointments")
async def list_appointments():
    """Lists all scheduled appointments."""
    appointments = _load_appointments()
    return JSONResponse(content={"status": "success", "appointments": appointments})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
