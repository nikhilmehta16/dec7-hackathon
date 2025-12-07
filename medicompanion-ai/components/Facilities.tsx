import React from "react";
import { BuildingIcon } from "./Icons";

export const Facilities: React.FC = () => {
  // Mock data for facilities, ideally this would come from an API
  const facilities = [
    {
      name: "City General Hospital",
      type: "Hospital",
      address: "123 Urban Ave, Metro City",
      services: ["Emergency", "Cardiology", "Neurology", "Geriatrics"],
      contact: "022-12345678",
      open: "24/7",
    },
    {
      name: "Senior Care Clinic",
      type: "Clinic",
      address: "45 Green Park, Metro City",
      services: ["Routine Checkups", "Physiotherapy", "Diabetes Care"],
      contact: "022-87654321",
      open: "Mon-Sat: 9AM - 6PM",
    },
    {
      name: "Metro Diagnostics Lab",
      type: "Laboratory",
      address: "88 Market Road, Metro City",
      services: ["Blood Tests", "X-Ray", "MRI", "Home Collection"],
      contact: "022-55555555",
      open: "Daily: 7AM - 9PM",
    },
    {
      name: "Arogya Pharmacy",
      type: "Pharmacy",
      address: "12 Main St, Metro City",
      services: ["Prescription Medicines", "Home Delivery"],
      contact: "022-99998888",
      open: "24/7",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Nearby Facilities
          </h2>
          <p className="text-gray-500 mt-2 text-lg">
            Healthcare services available in your urban area.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {facilities.map((facility, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <div className="p-4 bg-teal-50 text-teal-600 rounded-xl">
                <BuildingIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">
                  {facility.name}
                </h3>
                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mt-1 mb-2 font-medium uppercase tracking-wide">
                  {facility.type}
                </span>
                <p className="text-gray-600 text-base mb-2">
                  {facility.address}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {facility.services.map((s) => (
                    <span
                      key={s}
                      className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100 mt-3">
                  <span className="font-bold text-gray-700">
                    📞 {facility.contact}
                  </span>
                  <span className="text-green-600 font-medium">
                    🕒 {facility.open}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
