import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import LandingPage from "@/pages/LandingPage";
import PatientPortal from "@/pages/PatientPortal";
import PatientSettings from "@/pages/PatientSettings";
import MFADashboard from "@/pages/MFADashboard";
import MFAReminders from "@/pages/MFAReminders";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Patientenbereich */}
        <Route element={<RootLayout role="patient" />}>
          <Route path="/patient" element={<PatientPortal />} />
          <Route path="/patient/book" element={<PatientPortal />} />
          <Route path="/patient/appointments" element={<PatientPortal />} />
          <Route path="/patient/prescriptions" element={<PatientPortal />} />
          <Route path="/patient/settings" element={<PatientSettings />} />
        </Route>

        {/* MFA-Bereich */}
        <Route element={<RootLayout role="mfa" />}>
          <Route path="/mfa" element={<MFADashboard />} />
          <Route path="/mfa/patients" element={<MFADashboard />} />
          <Route path="/mfa/appointments" element={<MFADashboard />} />
          <Route path="/mfa/prescriptions" element={<MFADashboard />} />
          <Route path="/mfa/vaccinations" element={<MFADashboard />} />
          <Route path="/mfa/reminders" element={<MFAReminders />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}