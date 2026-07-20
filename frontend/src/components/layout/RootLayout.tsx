import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

interface RootLayoutProps {
  role: "patient" | "mfa" | "doctor";
}

export function RootLayout({ role }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <main className="flex-1 p-6 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
