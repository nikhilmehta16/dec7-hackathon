import React from "react";
import { AppRoute } from "../types";
import {
  LayoutDashboardIcon,
  CalendarIcon,
  FileTextIcon,
  MessageSquareIcon,
  BuildingIcon,
  ActivityIcon,
} from "./Icons";

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const NavItem = ({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-colors text-lg ${
      isActive
        ? "bg-primary-50 text-primary-700 font-bold border-2 border-primary-100"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeRoute,
  onNavigate,
}) => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 flex flex-col bg-white shadow-lg z-10">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
              A
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 block">
                Health Buddy
              </span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Urban Senior Care
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6">
          <NavItem
            icon={<LayoutDashboardIcon className="w-6 h-6" />}
            label="Dashboard"
            isActive={activeRoute === AppRoute.DASHBOARD}
            onClick={() => onNavigate(AppRoute.DASHBOARD)}
          />
          <NavItem
            icon={<MessageSquareIcon className="w-6 h-6" />}
            label="Health Buddy Chat"
            isActive={activeRoute === AppRoute.CHAT}
            onClick={() => onNavigate(AppRoute.CHAT)}
          />
          <NavItem
            icon={<CalendarIcon className="w-6 h-6" />}
            label="Appointments"
            isActive={activeRoute === AppRoute.APPOINTMENTS}
            onClick={() => onNavigate(AppRoute.APPOINTMENTS)}
          />
          <NavItem
            icon={<FileTextIcon className="w-6 h-6" />}
            label="Medical Reports"
            isActive={activeRoute === AppRoute.REPORTS}
            onClick={() => onNavigate(AppRoute.REPORTS)}
          />
          <NavItem
            icon={<BuildingIcon className="w-6 h-6" />}
            label="Facilities"
            isActive={activeRoute === AppRoute.FACILITIES}
            onClick={() => onNavigate(AppRoute.FACILITIES)}
          />
          <NavItem
            icon={<ActivityIcon className="w-6 h-6" />}
            label="IoT Devices"
            isActive={activeRoute === AppRoute.IOT}
            onClick={() => onNavigate(AppRoute.IOT)}
          />
        </nav>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500 text-center font-medium">
            Need Help?
            <br />
            <span className="text-primary-600 font-bold">Call 1800-AROGYA</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
};
