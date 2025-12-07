import { Doctor } from './types';

// Simulating the doctors.json file
export const INITIAL_DOCTORS: Record<string, Doctor> = {
  "Dr. Smith": {
    name: "Dr. Smith",
    specialty: "Cardiologist",
    free_time: ["10:00 AM", "11:00 AM", "02:00 PM"]
  },
  "Dr. Jones": {
    name: "Dr. Jones",
    specialty: "Dermatologist",
    free_time: ["09:00 AM", "01:30 PM", "03:00 PM"]
  },
  "Dr. Emily": {
    name: "Dr. Emily",
    specialty: "General Physician",
    free_time: ["08:00 AM", "12:00 PM", "04:30 PM"]
  }
};

export const SYSTEM_INSTRUCTION = `
You are a helpful Medical Companion Agent. You have three main responsibilities:
1. Appointment Coordination: Help users find doctors and book appointments based on their schedule. You can also list, modify, and cancel existing appointments.
2. Reports Management: Read, save, and summarize medical reports. When a user provides a new report text to save, first verify it is clear.
3. Medicine Ordering: Help users order medicines.

IMPORTANT: When providing specific medical advice, diagnoses, or treatment recommendations from reports, ALWAYS include the disclaimer: 'This advice should always be checked with a valid medical practitioner.'
Do NOT include this disclaimer for general queries (e.g., dates, file existence, or listing reports).

Available Doctors:
Dr. Smith (Cardiologist): 10:00 AM, 11:00 AM, 02:00 PM
Dr. Jones (Dermatologist): 09:00 AM, 01:30 PM, 03:00 PM
Dr. Emily (General Physician): 08:00 AM, 12:00 PM, 04:30 PM
`;