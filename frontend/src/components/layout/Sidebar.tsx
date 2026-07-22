import { Bell, Calendar, ClipboardList, FlaskConical, Home, LayoutDashboard, LogOut, Pill, Settings, User, Stethoscope, CalendarDays, ClipboardCheck, Clock } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const patientLinks = [
  { to: "/patient", icon: Home, label: "Übersicht" },
  { to: "/patient/book", icon: Calendar, label: "Termin buchen" },
  { to: "/patient/appointments", icon: ClipboardList, label: "Meine Termine" },
  { to: "/patient/prescriptions", icon: Pill, label: "Rezepte" },
  { to: "/patient/settings", icon: Settings, label: "Einstellungen" },
];

const mfaLinks = [
  { to: "/mfa", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/mfa/patients", icon: User, label: "Patienten" },
  { to: "/mfa/appointments", icon: Calendar, label: "Termine" },
  { to: "/mfa/prescriptions", icon: Pill, label: "Rezepte" },
  { to: "/mfa/vaccinations", icon: FlaskConical, label: "Impfungen" },
  { to: "/mfa/reminders", icon: Bell, label: "Erinnerungen" },
];

const doctorLinks = [
  { to: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/doctor/prescriptions", icon: ClipboardCheck, label: "Rezept-Freigabe" },
  { to: "/doctor/absences", icon: CalendarDays, label: "Urlaub & Abwesenheit" },
  { to: "/doctor/appointments", icon: CalendarDays, label: "Terminübersicht" },
  { to: "/doctor/master-data", icon: Stethoscope, label: "Stammdaten" },
  { to: "/doctor/acute-hours", icon: Clock, label: "Akutsprechstunde" },
];

interface SidebarProps {
  role: "patient" | "mfa" | "doctor";
}

export function Sidebar({ role }: SidebarProps) {
  let links = patientLinks;
  let portalLabel = "Patientenportal";
  if (role === "mfa") {
    links = mfaLinks;
    portalLabel = "MFA-Portal";
  } else if (role === "doctor") {
    links = doctorLinks;
    portalLabel = "Arzt-Portal";
  }

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b">
        <p className="font-semibold text-sm text-primary">Praxis Demir & Kollegen</p>
        <p className="text-xs text-muted-foreground">
          {portalLabel}
        </p>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/mfa" || link.to === "/doctor"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t">
        <NavLink
          to="/"
          onClick={() => {
            localStorage.removeItem("patient_insurance");
            localStorage.removeItem("patient_name");
            localStorage.removeItem("doctor_info");
          }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </NavLink>
      </div>
    </aside>
  );
}