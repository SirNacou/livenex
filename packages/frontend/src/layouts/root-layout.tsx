import { Outlet } from "@tanstack/react-router";
import { Header } from "../components/header.js";
import { Navigation } from "../components/nav.js";
import "../app.css";

/**
 * Root layout component
 * Provides header and navigation for all pages
 */
export function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex gap-4 p-4">
        <Navigation />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
