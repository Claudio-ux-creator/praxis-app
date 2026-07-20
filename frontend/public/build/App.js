import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import DoctorLogin from '@/pages/DoctorLogin';
import DoctorDashboard from '@/pages/DoctorDashboard';
import DoctorPrescriptions from '@/pages/DoctorPrescriptions';
import DoctorAbsences from '@/pages/DoctorAbsences';
import DoctorMasterData from '@/pages/DoctorMasterData';
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/doctor-login", element: _jsx(DoctorLogin, {}) }), _jsxs(Route, { element: _jsx(RootLayout, { role: "patient" }), children: [_jsx(Route, { path: "/patient", element: _jsx(PatientOverview, {}) }), _jsx(Route, { path: "/patient/book", element: _jsx(PatientPortal, {}) }), _jsx(Route, { path: "/patient/appointments", element: _jsx(PatientAppointments, {}) }), _jsx(Route, { path: "/patient/prescriptions", element: _jsx(PatientPrescriptions, {}) }), _jsx(Route, { path: "/patient/settings", element: _jsx(PatientSettings, {}) })] }), _jsxs(Route, { element: _jsx(RootLayout, { role: "mfa" }), children: [_jsx(Route, { path: "/mfa", element: _jsx(MFADashboard, {}) }), _jsx(Route, { path: "/mfa/patients", element: _jsx(MFAPatients, {}) }), _jsx(Route, { path: "/mfa/appointments", element: _jsx(MFAAppointments, {}) }), _jsx(Route, { path: "/mfa/prescriptions", element: _jsx(MFAPrescriptions, {}) }), _jsx(Route, { path: "/mfa/vaccinations", element: _jsx(MFAVaccinations, {}) }), _jsx(Route, { path: "/mfa/reminders", element: _jsx(MFAReminders, {}) })] }), _jsxs(Route, { element: _jsx(RootLayout, { role: "doctor" }), children: [_jsx(Route, { path: "/doctor", element: _jsx(DoctorDashboard, {}) }), _jsx(Route, { path: "/doctor/prescriptions", element: _jsx(DoctorPrescriptions, {}) }), _jsx(Route, { path: "/doctor/absences", element: _jsx(DoctorAbsences, {}) }), _jsx(Route, { path: "/doctor/master-data", element: _jsx(DoctorMasterData, {}) })] })] }) }));
}
