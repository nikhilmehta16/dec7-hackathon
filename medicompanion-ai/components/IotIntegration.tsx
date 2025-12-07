import React from "react";
import { ActivityIcon, UploadCloudIcon } from "./Icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock Blood Sugar Data
const bloodSugarData = [
  { time: "08:00", value: 95 },
  { time: "10:00", value: 110 },
  { time: "12:00", value: 105 },
  { time: "14:00", value: 130 },
  { time: "16:00", value: 115 },
  { time: "18:00", value: 100 },
  { time: "20:00", value: 98 },
];

export const IotIntegration: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          IoT Device Integration
        </h2>
        <p className="text-gray-500 mt-2 text-lg">
          Connect your health devices to share real-time data.
        </p>
      </div>

      {/* API Spec Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <UploadCloudIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Device API Specification
          </h3>
        </div>

        <p className="text-gray-600 mb-4">
          Use the endpoint below to upload health metrics directly from your IoT
          devices (smartwatch, glucose monitor, etc.).
        </p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <p className="text-green-400 font-bold mb-2">
            POST /api/v1/metrics/upload
          </p>
          <pre>{`{
  "device_id": "DEVICE_123",
  "user_id": "USER_ABC",
  "timestamp": "2023-10-27T10:00:00Z",
  "metrics": [
    {
      "type": "blood_sugar",
      "unit": "mg/dL",
      "value": 110
    },
    {
      "type": "heart_rate",
      "unit": "bpm",
      "value": 72
    }
  ]
}`}</pre>
        </div>
      </div>

      {/* Sample Dashboard Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
            <ActivityIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Live Health Dashboard
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Graph */}
          <div className="lg:col-span-2 h-80">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Blood Sugar Levels (Today)
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bloodSugarData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#e11d48"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#e11d48",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">
                Avg Heart Rate
              </p>
              <p className="text-3xl font-bold text-gray-900">
                72{" "}
                <span className="text-sm text-gray-400 font-normal">bpm</span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Steps Today</p>
              <p className="text-3xl font-bold text-gray-900">4,230</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">
                Sleep Duration
              </p>
              <p className="text-3xl font-bold text-gray-900">6h 45m</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
