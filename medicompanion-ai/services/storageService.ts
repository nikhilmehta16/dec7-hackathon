
import { Appointment, MedicalReport, ReportSummary, Doctor } from '../types';
import { DATA_API_URL as API_BASE_URL } from '../config';

// Helper for HTTP requests
const fetchJson = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

export const StorageService = {
  // --- Doctors ---
  getDoctors: async (): Promise<Record<string, Doctor>> => {
    try {
        return await fetchJson('/doctors');
    } catch (e) {
        console.warn("Could not fetch doctors from API, using fallback", e);
        return {
            "Dr. Smith": { specialty: "Cardiology", free_time: ["Monday 10:00-12:00"] },
            "Dr. Jones": { specialty: "Dermatology", free_time: ["Tuesday 09:00-11:00"] }
        };
    }
  },

  getDoctor: async (name: string): Promise<Doctor | undefined> => {
    const doctors = await StorageService.getDoctors();
    return doctors[name];
  },

  // --- Appointments ---
  getAppointments: async (): Promise<Appointment[]> => {
    try {
      const res = await fetchJson('/appointments');
      if (res.status === 'success') {
          return res.appointments || [];
      }
      return [];
    } catch (e) {
      console.warn("Could not fetch appointments from API", e);
      return [];
    }
  },

  saveAppointment: async (doctor: string, time_slot: string): Promise<{ status: string; message: string; error_message?: string }> => {
    // Mock
    return { status: "success", message: "Mock appointment saved" };
  },

  modifyAppointment: async (current_doctor_name: string, current_time_slot: string, new_doctor_name?: string, new_time_slot?: string): Promise<{ status: string; message?: string; error_message?: string }> => {
      // Mock
      return { status: "success", message: "Mock appointment modified" };
  },

  cancelAppointment: async (doctor: string, time_slot: string): Promise<{ status: string; message: string; error_message?: string }> => {
    // Mock
    return { status: "success", message: "Mock appointment cancelled" };
  },

  // --- Reports (Connected to Live API) ---
  getReportNames: async (): Promise<string[]> => {
      try {
        const res = await fetchJson('/reports');
        // The API returns { status: "success", reports: [...] } where reports is the list of summaries
        if (res.status === 'success' && Array.isArray(res.reports)) {
            return res.reports.map((r: any) => r.filename);
        }
        return [];
      } catch (e) {
          console.error("Failed to get report names", e);
          return [];
      }
  },

  getReportsSummary: async (): Promise<{ status: string; summaries: any[] }> => {
      try {
        const res = await fetchJson('/reports');
        if (res.status === 'success') {
            return { status: 'success', summaries: res.reports };
        }
        return { status: 'error', summaries: [] };
      } catch (e) {
          return { status: 'error', summaries: [] };
      }
  },

  saveReport: async (filename: string, content: string): Promise<{ status: string; message: string; summary: ReportSummary }> => {
    // api_app.py doesn't currently support POST /reports, only GET. 
    // We will need to implement that in api_app.py or use the Agent for writes.
    // For now, let's just log a warning or mock it if we want purely read-only API integration.
    // OR: We can implement the POST endpoint in api_app.py as a next step.
    console.warn("Save report not implemented in simple API yet.");
    return { 
        status: "error", 
        message: "API save not implemented", 
        summary: { date: "", diagnosis: "", medicines: "", other: "" } 
    };
  },

  getReportContent: async (filename: string): Promise<string | null> => {
      try {
        const res = await fetchJson(`/reports/${filename}`);
        if (res.status === 'success') {
            return res.content;
        }
        return null;
      } catch (e) {
          return null;
      }
  },

  // --- Medicine ---
  orderMedicine: async (medicine_name: string, quantity: number): Promise<{ status: string; message: string }> => {
      return { status: "success", message: "Mock order placed" };
  }
};
