import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import LandingPage from '@/pages/LandingPage';
import PatientPortal from '@/pages/PatientPortal';
import PatientOverview from '@/pages/PatientOverview';
import PatientAppointments from '@/pages/PatientAppointments';
import PatientPrescriptions from '@/pages/PatientPrescriptions';
import PatientSettings from '@/pages/PatientSettings';
import MFADashboard from '@/pages/MFADashboard';
import MFAPatients from '@/pages/MFAPatients';
import MFAAppointments from '@/pages/MFAAppointments';
import MFAPrescriptions from '@/pages/MFAPrescriptions';
import MFAVaccinations from '@/pages/MFAVaccinations';
import MFAReminders from '@/pages/MFAReminders';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Patientenbereich */}
        <Route element={<RootLayout role="patient" />}>
          <Route path="/patient" element={<PatientOverview />} />
          <Route path="/patient/book" element={<PatientPortal />} />
          <Route path="/patient/appointments" element={<PatientAppointments />} />
          <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
          <Route path="/patient/settings" element={<PatientSettings />} />
        </Route>

        {/* MFA-Bereich */}
        <Route element={<RootLayout role="mfa" />}>
          <Route path="/mfa" element={<MFADashboard />} />
          <Route path="/mfa/patients" element={<MFAPatients />} />
          <Route path="/mfa/appointments" element={<MFAAppointments />} />
          <Route path="/mfa/prescriptions" element={<MFAPrescriptions />} />
          <Route path="/mfa/vaccinations" element={<MFAVaccinations />} />
          <Route path="/mfa/reminders" element={<MFAReminders />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
