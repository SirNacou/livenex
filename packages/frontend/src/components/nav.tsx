import { Link } from "@tanstack/react-router";
import { Home, Settings, BarChart3 } from "lucide-react";

/**
 * Navigation component
 */
export function Navigation() {
  return (
    <nav className="w-48 bg-white border-r border-gray-200 p-4">
      <ul className="space-y-2">
        <li>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            activeProps={{ className: "bg-blue-50 text-blue-700" }}
          >
            <Home size={18} />
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/monitors"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            activeProps={{ className: "bg-blue-50 text-blue-700" }}
          >
            <BarChart3 size={18} />
            Monitors
          </Link>
        </li>
        <li>
          <Link
            to="/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            activeProps={{ className: "bg-blue-50 text-blue-700" }}
          >
            <Settings size={18} />
            Settings
          </Link>
        </li>
      </ul>
    </nav>
  );
}
