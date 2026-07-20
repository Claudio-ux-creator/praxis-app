import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Stethoscope, FileText } from 'lucide-react';
import { get, patch } from '@/lib/api';
const STATUS_MAP = {
    SCHEDULED: 'Geplant',
    PENDING_CONFIRMATION: 'Ausstehend',
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
    BLOOD_DRAW: 'Blutabnahme',
    INITIAL: 'Erstgespräch',
};
const STATUS_BADGE = {
    SCHEDULED: 'default',
    PENDING_CONFIRMATION: 'secondary',
    CHECKED_IN: 'default',
    IN_PROGRESS: 'default',
    COMPLETED: 'outline',
    CANCELLED: 'destructive',
    NO_SHOW: 'destructive',
};
export default function MFAAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const loadAppointments = () => {
        setLoading(true);
        get('/mfa/appointments').then((r) => {
            if (r.success && r.data)
                setAppointments(r.data);
            setLoading(false);
        });
    };
    useEffect(() => {
        loadAppointments();
    }, []);
    const handleConfirm = async (id) => {
        await patch("/appointments/" + id + "/confirm-series", {});
        loadAppointments();
    };
    const handleStatusChange = async (id, newStatus) => {
        await patch("/appointments/" + id + "/status", { status: newStatus });
        loadAppointments();
    };
    const filtered = filter === 'ALL'
        ? appointments
        : appointments.filter((a) => a.status === filter);
    const counts = {};
    for (const a of appointments) {
        counts[a.status] = (counts[a.status] || 0) + 1;
    }
    counts['ALL'] = appointments.length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Alle Termine" }), _jsx("div", { className: "flex gap-1", children: ['ALL', ...Object.keys(STATUS_MAP)].map((s) => {
                            if (!counts[s] && s !== 'ALL')
                                return null;
                            return (_jsxs(Button, { size: "sm", variant: filter === s ? 'default' : 'outline', onClick: () => setFilter(s), className: "text-xs", children: [s === 'ALL' ? 'Alle' : STATUS_MAP[s], _jsxs("span", { className: "ml-1.5 opacity-70", children: ["(", counts[s] || 0, ")"] })] }, s));
                        }) })] }), loading && _jsx("p", { className: "text-muted-foreground", children: "Lade Termine..." }), !loading && filtered.length === 0 && (_jsx(Card, { children: _jsx(CardContent, { className: "py-8 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "Keine Termine gefunden." }) }) })), _jsx("div", { className: "space-y-3", children: filtered.map((a) => (_jsx(Card, { children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "font-medium", children: [a.patient_last_name, ", ", a.patient_first_name] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(", a.insurance_number, ")"] })] }), _jsxs("div", { className: "flex items-center gap-3 text-sm text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "h-3.5 w-3.5" }), a.date] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-3.5 w-3.5" }), a.time] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Stethoscope, { className: "h-3.5 w-3.5" }), "Dr. ", a.doctor_last_name] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(FileText, { className: "h-3.5 w-3.5" }), CATEGORY_LABEL[a.category] || a.category] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [a.status === "PENDING_CONFIRMATION" && (_jsx(Button, { size: "sm", variant: "default", onClick: () => handleConfirm(a.id), children: "Best\u00E4tigen" })), a.status === "SCHEDULED" && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => handleStatusChange(a.id, "CHECKED_IN"), children: "Check-In" }), _jsx(Button, { size: "sm", variant: "destructive", onClick: () => handleStatusChange(a.id, "CANCELLED"), children: "Stornieren" })] })), _jsx(Badge, { variant: (STATUS_BADGE[a.status] || 'outline'), children: STATUS_MAP[a.status] || a.status })] })] }) }) }, a.id))) })] }));
}
