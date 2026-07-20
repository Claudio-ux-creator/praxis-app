import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, ClipboardList, Pill } from 'lucide-react';
import { get } from '@/lib/api';
const STATUS_MAP = {
    SCHEDULED: 'Gebucht',
    PENDING_CONFIRMATION: 'Bestätigung ausstehend',
    CHECKED_IN: 'Eingecheckt',
    IN_PROGRESS: 'In Behandlung',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert',
    NO_SHOW: 'Nicht erschienen',
};
const CATEGORY_LABEL = {
    CHECKUP: 'Vorsorge',
    CONSULTATION: 'Beratung',
    VACCINATION: 'Impfung',
    PRESCRIPTION_PICKUP: 'Rezept-Abholung',
    ACUTE: 'Akut',
};
export default function PatientOverview() {
    const navigate = useNavigate();
    const patientName = localStorage.getItem('patient_name') || 'Patient';
    const insuranceNumber = localStorage.getItem('patient_insurance') || '';
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    useEffect(() => {
        if (!insuranceNumber)
            return;
        get('/appointments?insuranceNumber=' + insuranceNumber).then((r) => {
            if (r.success && r.data)
                setAppointments(r.data);
        });
        get('/prescriptions?insuranceNumber=' + insuranceNumber).then((r) => {
            if (r.success && r.data)
                setPrescriptions(r.data);
        });
    }, [insuranceNumber]);
    const nextAppointment = appointments
        .filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
    const pendingConfirmations = appointments.filter((a) => a.status === 'PENDING_CONFIRMATION');
    const pendingPrescriptions = prescriptions.filter((a) => a.status === 'PENDING' || a.status === 'APPROVED');
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-semibold", children: ["Willkommen, ", patientName] }), _jsxs("p", { className: "text-muted-foreground", children: ["Versichertennummer: ", insuranceNumber] })] }), nextAppointment && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(Calendar, { className: "h-5 w-5 text-primary" }), "N\u00E4chster Termin"] }) }), _jsxs(CardContent, { children: [_jsxs("p", { className: "text-sm", children: [_jsx("strong", { children: nextAppointment.date }), " um ", _jsx("strong", { children: nextAppointment.time })] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [CATEGORY_LABEL[nextAppointment.category] || nextAppointment.category, " bei Dr. ", nextAppointment.doctor_last_name, ' — ', _jsx("span", { className: "font-medium", children: STATUS_MAP[nextAppointment.status] || nextAppointment.status })] })] })] })), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsx(Card, { className: "cursor-pointer transition-all hover:border-primary hover:shadow-md", onClick: () => navigate('/patient/book'), children: _jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4" }), "Termin buchen"] }), _jsx(CardDescription, { children: "Neuen Termin vereinbaren" })] }) }), _jsx(Card, { className: 'cursor-pointer transition-all hover:shadow-md ' + (pendingConfirmations.length > 0 ? 'hover:border-amber-500 border-amber-200' : 'hover:border-primary'), onClick: () => navigate('/patient/appointments'), children: _jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(ClipboardList, { className: "h-4 w-4" }), "Meine Termine"] }), _jsxs(CardDescription, { children: [appointments.length, " Termine", pendingConfirmations.length > 0 && (_jsxs("span", { className: "ml-2 text-amber-600 font-semibold", children: ["(", pendingConfirmations.length, " ausstehend)"] }))] })] }) }), _jsx(Card, { className: 'cursor-pointer transition-all hover:shadow-md ' + (pendingPrescriptions.length > 0 ? 'hover:border-amber-500 border-amber-200' : 'hover:border-primary'), onClick: () => navigate('/patient/prescriptions'), children: _jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(Pill, { className: "h-4 w-4" }), "Rezepte"] }), _jsxs(CardDescription, { children: [prescriptions.length, " Rezepte", pendingPrescriptions.length > 0 && (_jsxs("span", { className: "ml-2 text-amber-600 font-semibold", children: ["(", pendingPrescriptions.length, " offen)"] }))] })] }) })] })] }));
}
