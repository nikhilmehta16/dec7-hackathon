import datetime
import os
import glob
import json
import re
import mimetypes
import google.generativeai as genai
from typing import Optional
from zoneinfo import ZoneInfo
from google.adk.agents import Agent, LoopAgent
from google.adk.tools import AgentTool
from google.adk.tools.google_search_tool import GoogleSearchTool
from google.adk.tools.preload_memory_tool import PreloadMemoryTool

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datasets')
APPOINTMENTS_FILE = os.path.join(DATASETS_DIR, 'appointments.json')
DOCTORS_FILE = os.path.join(DATASETS_DIR, 'doctors.json')
REPORTS_SUMMARY_FILE = os.path.join(DATASETS_DIR, 'reports_summary.json')

# --- Shared State Keys ---
STATE_CURRENT_REPORT_CONTENT = "current_report_content"
STATE_CLARIFICATION_NEEDED = "clarification_needed"
STATE_SUMMARY_CONFIRMATION = "summary_confirmation"
STATE_USER_RESPONSE = "user_response"

def _load_appointments():
    if not os.path.exists(APPOINTMENTS_FILE):
        return []
    try:
        with open(APPOINTMENTS_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def _save_appointments(appointments):
    if not os.path.exists(DATASETS_DIR):
        os.makedirs(DATASETS_DIR)
    with open(APPOINTMENTS_FILE, 'w') as f:
        json.dump(appointments, f, indent=4)

def _load_doctors():
    if not os.path.exists(DOCTORS_FILE):
        return {}
    try:
        with open(DOCTORS_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def _load_reports_summary():
    if not os.path.exists(REPORTS_SUMMARY_FILE):
        return []
    try:
        with open(REPORTS_SUMMARY_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def _save_reports_summary(summaries):
    if not os.path.exists(DATASETS_DIR):
        os.makedirs(DATASETS_DIR)
    with open(REPORTS_SUMMARY_FILE, 'w') as f:
        json.dump(summaries, f, indent=4)

def _parse_report_content(content: str) -> dict:
    """Parses report content to extract summary fields."""
    summary = {
        "date": "Unknown",
        "diagnosis": "Unknown",
        "medicines": "None mentioned",
        "other": ""
    }
    
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if line.lower().startswith("date:"):
            summary["date"] = line.split(":", 1)[1].strip()
        elif line.lower().startswith("diagnosis:"):
            summary["diagnosis"] = line.split(":", 1)[1].strip()
        elif line.lower().startswith("recommendation:"):
            summary["medicines"] = line.split(":", 1)[1].strip()
        elif line.lower().startswith("symptoms:"):
            summary["other"] = line # Keep the whole line for context
            
    return summary

def list_doctors() -> dict:
    """Lists all available doctors and their specialties with their appointmnet. use this if someone ask for list of doctors."""
    doctors = _load_doctors()
    if not doctors:
        return {"status": "success", "message": "No doctors found.", "doctors": []}
    
    # Format for better readability by the agent
    doctor_list = []
    for name, details in doctors.items():
        doctor_list.append({
            "name": name,
            "specialty": details.get("specialty", "Unknown"),
            "available_slots": details.get("free_time", [])
        })
        
    return {"status": "success", "doctors": doctor_list}

def get_doctor_schedule(doctor_name: str) -> dict:
    """Retrieves the schedule and specialty for a specified doctor."""
    doctors = _load_doctors()
    doctor = doctors.get(doctor_name)
    if doctor:
        return {
            "status": "success",
            "doctor": doctor_name,
            "specialty": doctor["specialty"],
            "available_slots": doctor["free_time"]
        }
    else:
        return {
            "status": "error",
            "error_message": f"Doctor '{doctor_name}' not found. Available doctors: {list(doctors.keys())}"
        }

def book_appointment(doctor_name: str, time_slot: str) -> dict:
    """Books an appointment with a doctor at a specific time."""
    doctors = _load_doctors()
    doctor = doctors.get(doctor_name)
    if not doctor:
        return {"status": "error", "error_message": f"Doctor '{doctor_name}' not found."}
    
    if time_slot not in doctor["free_time"]:
        return {
            "status": "error", 
            "error_message": f"Slot '{time_slot}' is not available for {doctor_name}. Available: {doctor['free_time']}"
        }
    
    appointments = _load_appointments()
    
    # Check for duplicates
    for appt in appointments:
        if appt['doctor'] == doctor_name and appt['time_slot'] == time_slot:
            return {"status": "error", "error_message": f"Slot '{time_slot}' with {doctor_name} is already booked."}

    new_appointment = {
        "doctor": doctor_name,
        "time_slot": time_slot,
        "booked_at": datetime.datetime.now().isoformat()
    }
    
    appointments.append(new_appointment)
    _save_appointments(appointments)

    return {
        "status": "success",
        "message": f"Appointment confirmed with {doctor_name} for {time_slot}."
    }

def modify_appointment(current_doctor_name: str, current_time_slot: str, new_doctor_name: Optional[str] = None, new_time_slot: Optional[str] = None) -> dict:
    """Modifies an existing appointment."""
    appointments = _load_appointments()
    doctors = _load_doctors()
    found = False
    target_appt = None
    
    for appt in appointments:
        if appt['doctor'] == current_doctor_name and appt['time_slot'] == current_time_slot:
            target_appt = appt
            found = True
            break
            
    if not found:
        return {"status": "error", "error_message": "Appointment not found."}
    
    # Set new values or keep old ones
    target_doctor = new_doctor_name if new_doctor_name else current_doctor_name
    target_slot = new_time_slot if new_time_slot else current_time_slot
    
    # Validate new details
    doctor = doctors.get(target_doctor)
    if not doctor:
        return {"status": "error", "error_message": f"New doctor '{target_doctor}' not found."}
        
    if target_slot not in doctor["free_time"]:
         return {
            "status": "error", 
            "error_message": f"Slot '{target_slot}' is not available for {target_doctor}. Available: {doctor['free_time']}"
        }
        
    # Remove old appointment temporarily to check for conflicts
    appointments.remove(target_appt)
    
    for appt in appointments:
         if appt['doctor'] == target_doctor and appt['time_slot'] == target_slot:
            # Revert
            appointments.append(target_appt)
            return {"status": "error", "error_message": f"Slot '{target_slot}' with {target_doctor} is already booked."}

    # Add new appointment
    new_appt = {
        "doctor": target_doctor,
        "time_slot": target_slot,
        "booked_at": datetime.datetime.now().isoformat(),
        "modified_at": datetime.datetime.now().isoformat()
    }
    appointments.append(new_appt)
    _save_appointments(appointments)
    
    return {
        "status": "success",
        "message": f"Appointment updated to {target_doctor} at {target_slot}."
    }

def cancel_appointment(doctor_name: str, time_slot: str) -> dict:
    """Cancels/Deletes an existing appointment."""
    appointments = _load_appointments()
    initial_count = len(appointments)
    
    appointments = [appt for appt in appointments if not (appt['doctor'] == doctor_name and appt['time_slot'] == time_slot)]
    
    if len(appointments) == initial_count:
        return {"status": "error", "error_message": "Appointment not found."}
        
    _save_appointments(appointments)
    return {"status": "success", "message": "Appointment cancelled successfully."}

def list_appointments() -> dict:
    """Lists all currently booked appointments."""
    appointments = _load_appointments()
    if not appointments:
        return {"status": "success", "message": "No appointments found.", "appointments": []}
        
    return {"status": "success", "appointments": appointments}

def list_medical_reports() -> dict:
    """Lists all available medical reports for the user."""
    try:
        if not os.path.exists(DATASETS_DIR):
             return {"status": "error", "error_message": "Datasets directory not found."}
        
        files = glob.glob(os.path.join(DATASETS_DIR, "*.txt"))
        report_names = [os.path.basename(f) for f in files]
        return {"status": "success", "reports": report_names}
    except Exception as e:
        return {"status": "error", "error_message": str(e)}

def get_reports_summary() -> dict:
    """Retrieves a summary of all medical reports."""
    try:
        summaries = _load_reports_summary()
        return {"status": "success", "summaries": summaries}
    except Exception as e:
        return {"status": "error", "error_message": str(e)}

def save_medical_report(filename: str, content: str) -> dict:
    """Saves a new medical report and updates the summary index."""
    try:
        if not os.path.exists(DATASETS_DIR):
            os.makedirs(DATASETS_DIR)
            
        file_path = os.path.join(DATASETS_DIR, filename)
        with open(file_path, 'w') as f:
            f.write(content)
            
        # Parse and update summary
        summary_data = _parse_report_content(content)
        
        summaries = _load_reports_summary()
        # Remove existing entry if updating
        summaries = [s for s in summaries if s['filename'] != filename]
        
        summaries.append({
            "filename": filename,
            "summary": summary_data
        })
        
        _save_reports_summary(summaries)
        
        return {
            "status": "success",
            "message": f"Report '{filename}' saved and summarized.",
            "summary": summary_data
        }
    except Exception as e:
        return {"status": "error", "error_message": str(e)}

def _analyze_document(file_path: str, mime_type: str) -> dict:
    """Analyzes a medical document (PDF or Image) to extract content using Gemini."""
    try:
        # Configure GenAI
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
             return {"status": "error", "error_message": "GOOGLE_API_KEY not found in environment."}
        
        genai.configure(api_key=api_key)

        sample_file = genai.upload_file(path=file_path, mime_type=mime_type)
        
        # Using gemini-1.5-flash for multimodal capabilities
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        
        prompt = "Extract all text and key medical details (Date, Diagnosis, Medicines, Symptoms) from this document. Provide the raw text content as well."
        
        response = model.generate_content([sample_file, prompt])
        
        return {
            "status": "success",
            "content": response.text
        }
    except Exception as e:
        return {"status": "error", "error_message": str(e)}

def read_report(report_name: str) -> dict:
    """Reads the content of a specific medical report. Supports Text, PDF, and Images (JPEG, PNG)."""
    try:
        file_path = os.path.join(DATASETS_DIR, report_name)
        if not os.path.exists(file_path):
             return {"status": "error", "error_message": f"Report '{report_name}' not found in {DATASETS_DIR}."}
        
        mime_type, _ = mimetypes.guess_type(file_path)
        
        # If it is a text file, read normally
        if mime_type and mime_type.startswith('text'):
            with open(file_path, 'r') as f:
                content = f.read()
            return {
                "status": "success",
                "content": content
            }
        
        # If image or pdf, use Gemini Vision/Multimodal
        elif mime_type and (mime_type.startswith('image') or mime_type == 'application/pdf'):
             return _analyze_document(file_path, mime_type)
        
        # Fallback: Check extension if mime_type is None
        elif file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.pdf')):
             # Guess mime based on extension manually if mimetypes failed
             if file_path.lower().endswith('.pdf'):
                 mime = 'application/pdf'
             elif file_path.lower().endswith('.png'):
                 mime = 'image/png'
             else:
                 mime = 'image/jpeg'
             return _analyze_document(file_path, mime)

        else:
             # Fallback try text
             try:
                with open(file_path, 'r') as f:
                    content = f.read()
                return {"status": "success", "content": content}
             except Exception as e:
                return {"status": "error", "error_message": f"Could not read file {report_name}. Mime: {mime_type}. Error: {str(e)}"}

    except Exception as e:
        return {"status": "error", "error_message": str(e)}

def order_medicine(medicine_name: str, quantity: int) -> dict:
    """Orders a specified quantity of medicine."""
    return {
        "status": "success",
        "message": f"Order placed for {quantity} units of {medicine_name}. Delivery expected in 2 days."
    }

def analyze_past_checkups(limit: int = 3) -> dict:
    """Analyzes the past N medical reports to identify potential disease patterns or history.
    
    Args:
        limit (int): The number of past reports to analyze (default 3).
        
    Returns:
        dict: Analysis of past reports including potential patterns.
    """
    try:
        summaries = _load_reports_summary()
        # Sort summaries by date if possible, for now we just take the last N added
        recent_summaries = summaries[-limit:]
        
        analysis = {
            "reports_analyzed": len(recent_summaries),
            "diagnoses_history": [s['summary']['diagnosis'] for s in recent_summaries],
            "symptoms_history": [s['summary']['other'] for s in recent_summaries],
            "medicines_history": [s['summary']['medicines'] for s in recent_summaries],
            "message": "Analysis based on available report summaries."
        }
        
        return {
            "status": "success",
            "analysis": analysis
        }
    except Exception as e:
        return {"status": "error", "error_message": str(e)}

def call_family(contact_name: str, message: str = "Emergency") -> dict:
    """Simulates calling a family member."""
    return {
        "status": "success",
        "message": f"Calling {contact_name} with message: {message}"
    }

def book_ambulance(location: str, urgency: str = "High") -> dict:
    """Simulates booking an ambulance."""
    return {
        "status": "success",
        "message": f"Ambulance dispatched to {location}. Urgency: {urgency}"
    }

# --- Loop Agent Components ---

def ask_user_for_clarification(question: str) -> dict:
    """Asks the user a clarifying question about the report."""
    # In a real scenario, this would trigger a UI prompt. 
    # For now, we simulate asking by returning the question.
    return {
        "status": "waiting_for_input",
        "question": question
    }

clarity_checker_agent = Agent(
    name="ClarityChecker",
    model="gemini-2.5-flash",
    instruction="""You are checking a medical report for clarity.
    Review the 'current_report_content'.
    Check if the following fields are clearly present: Date, Diagnosis, Recommendation/Medicines, Symptoms.
    
    IF any key information is missing or unclear:
        Generate a specific question to ask the user to provide that information.
        Set 'clarification_needed' to true.
        Output ONLY the question.
    
    ELSE (if all information seems clear):
        Set 'clarification_needed' to false.
        Output "CLEAR".
    """,
    description="Checks if the report content is clear and complete.",
    tools=[ask_user_for_clarification]
)

summary_generator_agent = Agent(
    name="SummaryGenerator",
    model="gemini-2.5-flash",
    instruction="""You are generating a final summary confirmation for a medical report.
    Use the 'current_report_content' (and any 'user_response' provided) to create a structured summary.
    
    Format:
    "I am about to save this report with the following summary:
    Date: ...
    Diagnosis: ...
    Medicines: ...
    Symptoms: ...
    
    Is this correct? (Say 'Go ahead' to save)"
    """,
    description="Generates a summary confirmation for the user.",
    tools=[save_medical_report]
)

report_verification_loop = LoopAgent(
    name="ReportVerificationLoop",
    sub_agents=[clarity_checker_agent, summary_generator_agent],
    max_iterations=3,
    description="Loop to verify report details with the user before saving."
)

# --- Research Agent ---
research_agent = Agent(
    name="MedicalResearchAgent",
    model="gemini-2.5-flash",
    instruction="""You are a Medical Research Agent.
    Your task is to search for new cure methods, treatments, and ongoing research for specific diseases, especially rare ones.
    Use the Google Search tool to find the most recent and relevant information.
    Synthesize the search results into a concise summary of potential treatments, clinical trials, or new therapies.
    Always prioritize information from reputable medical sources (journals, universities, major health organizations).
    
    Example: If asked about "gene therapy for [rare disease]", search for "gene therapy [rare disease] latest research", "clinical trials [rare disease] gene therapy", etc.
    """,
    description="Searches for new treatments and cures for diseases, especially rare ones.",
    tools=[GoogleSearchTool()]
)

root_agent = Agent(
    name="medical_companion_agent",
    model="gemini-2.5-flash",
    description=(
        "A medical companion agent that helps coordinate appointments with doctors, "
        "manage medical reports, and order medicines."
    ),
    instruction=(
        "You are a helpful Medical Companion Agent. You have five main responsibilities:\n"
        "1. Appointment Coordination: Help users find doctors and book appointments based on their schedule. "
        "You can also list, modify, and cancel existing appointments.\n"
        "2. Reports Management: Read, save, and summarize medical reports. "
        "Use 'get_reports_summary' to see an overview of all reports. "
        "When a user provides a new report text to save, first verify it is clear. "
        "Use 'save_medical_report' ONLY after confirmation. "
        "Use 'read_report' to read the full content of any report. It automatically extracts text from Images and PDFs using Gemini Vision."
        "IMPORTANT: When providing specific medical advice, diagnoses, or treatment recommendations from reports, "
        "ALWAYS include the disclaimer: 'This advice should always be checked with a valid medical practitioner.' "
        "Do NOT include this disclaimer for general queries (e.g., dates, file existence, or listing reports) that do not contain medical advice.\n"
        "3. Medicine Ordering: Help users order medicines.\n"
        "4. Research: Search for new cures and treatments for rare diseases using the research agent.\n"
        "5. Health Analysis: Use 'analyze_past_checkups' to review the user's recent medical history. "
        "6. Emergency Services: Call family members or book an ambulance in case of emergency.\n"
        "The agent has MEMORY enabled for every interaction. You should ALWAYS be aware of the user's past medical history from previous turns and context. "
        "Use the information from memory to provide personalized and context-aware responses.\n\n"
        "If the user asks to see their reports, try 'get_reports_summary' first for a quick overview."
    ),
    tools=[
        list_doctors,
        get_doctor_schedule, 
        book_appointment,
        modify_appointment,
        cancel_appointment,
        list_appointments,
        list_medical_reports,
        get_reports_summary,
        save_medical_report,
        read_report, 
        order_medicine,
        ask_user_for_clarification,
        analyze_past_checkups,
        call_family,
        book_ambulance,
        AgentTool(research_agent),
        PreloadMemoryTool()
    ],
)
