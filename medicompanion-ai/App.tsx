import React, { useState, useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ChatInterface } from "./components/ChatInterface";
import { IotIntegration } from "./components/IotIntegration";
import { Facilities } from "./components/Facilities";
import { AppRoute, Appointment, MedicalReport, Doctor } from "./types";
import { StorageService } from "./services/storageService";
import {
  CalendarIcon,
  FileTextIcon,
  PlusIcon,
  DownloadIcon,
} from "./components/Icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Dashboard Page ---
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ appointments: 0, reports: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const apps = await StorageService.getAppointments();
      const reports = await StorageService.getReportNames(); // Using names just for count
      setStats({ appointments: apps.length, reports: reports.length });
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.appointments}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <FileTextIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Medical Reports
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.reports}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Appointments Page ---
const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async () => {
    const data = await StorageService.getAppointments();
    setAppointments(data);
  };

  useEffect(() => {
    fetchAppointments();
    // Poll for updates in case the Chat Agent adds one
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, []);

  const cancelAppt = async (doctor: string, slot: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      await StorageService.cancelAppointment(doctor, slot);
      fetchAppointments();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Appointments</h2>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No appointments scheduled.</p>
          <p className="text-sm text-gray-400 mt-2">
            Ask the AI Assistant to book one for you.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt: any) => (
            <div
              key={apt.id || apt.doctor + apt.time_slot}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {apt.doctor}
                </h3>
                <p className="text-primary-600 font-medium">{apt.time_slot}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Booked on{" "}
                  {apt.booked_at
                    ? new Date(apt.booked_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
              <button
                onClick={() => cancelAppt(apt.doctor, apt.time_slot)}
                className="text-red-600 text-sm hover:underline px-3 py-1 bg-red-50 rounded-md"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Reports Page ---
const Reports: React.FC = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newFilename, setNewFilename] = useState("");
  const [newContent, setNewContent] = useState("");

  const refreshReports = async () => {
    // Since getReports might fail if backend doesn't implement full object return,
    // we try to use getReportsSummary or similar if available, or just list names.
    // For this demo, let's try to get summaries which contains metadata.
    try {
      const summaryRes = await StorageService.getReportsSummary();
      if (summaryRes && summaryRes.summaries) {
        // Transform summary to Report shape
        const mappedReports = summaryRes.summaries.map((s: any) => ({
          id: s.filename,
          filename: s.filename,
          content: "Content available via chat or download", // Placeholder if we don't fetch full content
          uploaded_at: new Date().toISOString(),
          summary: s.summary,
        }));
        setReports(mappedReports);
      }
    } catch (e) {
      console.error("Failed to load report summaries", e);
    }
  };

  useEffect(() => {
    refreshReports();
    const interval = setInterval(refreshReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    await StorageService.saveReport(newFilename, newContent);
    setIsUploadOpen(false);
    setNewFilename("");
    setNewContent("");
    refreshReports();
  };

  const downloadReport = async (filename: string) => {
    const content = await StorageService.getReportContent(filename);
    if (!content) {
      alert("Could not retrieve report content");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Medical Reports</h2>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Upload Report</span>
        </button>
      </div>

      {/* Upload Modal Simulation */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Add New Report</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="blood_test_jan.txt"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Content (Paste Text)
                </label>
                <textarea
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Date: 2023-01-01&#10;Diagnosis: Healthy..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                  <FileTextIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {report.filename}
                  </h3>

                  {/* Summary preview */}
                  {report.summary && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {report.summary.date}
                      </p>
                      <p>
                        <span className="font-medium">Diagnosis:</span>{" "}
                        {report.summary.diagnosis}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => downloadReport(report.filename)}
                className="text-gray-400 hover:text-primary-600 p-2"
                title="Download Content"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No reports found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.DASHBOARD);

  const renderContent = () => {
    switch (activeRoute) {
      case AppRoute.DASHBOARD:
        return <Dashboard />;
      case AppRoute.APPOINTMENTS:
        return <Appointments />;
      case AppRoute.REPORTS:
        return <Reports />;
      case AppRoute.FACILITIES:
        return <Facilities />;
      case AppRoute.IOT:
        return <IotIntegration />;
      case AppRoute.CHAT:
        return <ChatInterface />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <HashRouter>
      <Layout activeRoute={activeRoute} onNavigate={setActiveRoute}>
        {renderContent()}
      </Layout>
    </HashRouter>
  );
}
