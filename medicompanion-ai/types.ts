export interface Doctor {
  name: string;
  specialty: string;
  free_time: string[];
}

export interface Appointment {
  id: string;
  doctor: string;
  time_slot: string;
  booked_at: string;
}

export interface MedicalReport {
  id: string;
  filename: string;
  content: string;
  uploaded_at: string;
  summary?: ReportSummary;
}

export interface ReportSummary {
  date: string;
  diagnosis: string;
  medicines: string;
  other: string;
}

export interface ChatAttachment {
  name: string;
  type: string;
  data: string; // Base64
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  attachment?: ChatAttachment;
  timestamp: Date;
  isThinking?: boolean;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  APPOINTMENTS = 'appointments',
  REPORTS = 'reports',
  FACILITIES = 'facilities',
  IOT = 'iot',
  CHAT = 'chat'
}