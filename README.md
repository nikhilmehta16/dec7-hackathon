# Medical Companion AI - Dec 7 Hackathon

This project is a comprehensive Medical Companion AI designed to assist users with managing their healthcare needs. It integrates a conversational AI agent with a React-based frontend and a FastAPI backend to handle appointments, medical reports, and medicine ordering.

## Project Structure

The project consists of the following main components:

- **`medicompanion-ai/`**: The frontend application built with React and Vite. It provides a user interface for viewing medical reports, appointments, and interacting with the system.
- **`api_app.py`**: A FastAPI backend service that exposes endpoints for retrieving and managing medical data (reports, doctors, appointments).
- **`my_agent/agent.py`**: Contains the core logic for the "Medical Companion Agent". This agent uses Google's Generative AI (Gemini) to:
  - Coordinate appointments (book, modify, cancel).
  - Manage and summarize medical reports (Text, PDF, Image).
  - Order medicines.
  - Perform medical research for treatments using Google Search.
  - Analyze past medical history.
- **`medical_companion_agent/agent.py`**: An alternative or previous version of the agent logic.
- **`datasets/`**: A directory used for persistent storage of JSON data files (appointments, doctors, report summaries) and raw report files.

## Features

1.  **Appointment Management**:

    - View available doctors and their schedules.
    - Book, reschedule, and cancel appointments.
    - Automatic conflict detection.

2.  **Medical Records & Analysis**:

    - **Multimodal Support**: Upload and analyze medical reports in Text, PDF, or Image formats.
    - **Summarization**: Automatically extracts key details (Diagnosis, Medicines, Symptoms) from reports.
    - **History Analysis**: Analyzes past reports to identify health trends.

3.  **Research Assistant**:

    - A dedicated Research Agent that searches the web for the latest treatments and cures, specifically for rare diseases.

4.  **Medicine Ordering**:

    - Simple interface to place orders for prescribed medicines.

5.  **Emergency Services**:
    - Capabilities to simulate calling family members or booking an ambulance.

## Setup and Installation

### Prerequisites

- Python 3.9+
- Node.js & npm
- Google Gemini API Key (set as `GOOGLE_API_KEY` environment variable)

### Backend Setup

1.  Navigate to the root directory (`dec7-hackathon`).
2.  Install required Python packages (ensure you have `fastapi`, `uvicorn`, `google-generativeai`, and the `google-adk` libraries installed).
3.  Run the API server:
    ```bash
    python api_app.py
    ```
    The server will start at `http://0.0.0.0:8001`.

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd medicompanion-ai
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will typically run at `http://localhost:5173`.

## Usage

- **API**: Access the interactive API docs at `http://localhost:8001/docs` when the backend is running.
- **Frontend**: Open the web application to browse your medical reports dashboard.
- **Agent**: The agent logic is designed to be integrated into an agent runner or chat interface that utilizes the defined tools in `my_agent/agent.py`.

## Data Storage

All data is stored locally in the `datasets/` folder:

- `doctors.json`: List of doctors and their availability.
- `appointments.json`: Log of booked appointments.
- `reports_summary.json`: Metadata and summaries of processed medical reports.
- `*.txt`: Raw text content of medical reports.
