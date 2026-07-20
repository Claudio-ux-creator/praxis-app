import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { get, patch } from '@/lib/api';
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
const STATUS_BADGE = {
    SCHEDULED: 'default',
    PENDING_CONFIRMATION: 'secondary',
    CHECKED_IN: 'default',
    IN_PROGRESS: 'default',
    COMPLETED: 'outline',
    CANCELLED: 'destructive',
    NO_SHOW: 'destructive',
};
export default function PatientAppointments() {
    const insuranceNumber = localStorage.getItem('patient_insurance') || '';
    const [appointments, setAppointments] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const loadAppointments = () => {
        setLoading(true);
        get('/appointments?insuranceNumber=' + insuranceNumber).then((r) => {
            if (r.success && r.data)
                setAppointments(r.data);
            setLoading(false);
        });
    };
    useEffect(() => {
        loadAppointments();
    }, [insuranceNumber]);
    const handleConfirmSeries = async (appointmentId) => {
        const r = await patch('/appointments/' + appointmentId + '/confirm-series', {});
        if (r.success)
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
    if (loading) {
        return _jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "Lade Termine..." }) });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Meine Termine" }), _jsx("div", { className: "flex gap-1 flex-wrap", children: ['ALL', ...Object.keys(STATUS_MAP)].map((s) => {
                            if (!counts[s] && s !== 'ALL')
                                return null;
                            return (_jsxs(Button, { size: "sm", variant: filter === s ? 'default' : 'outline', onClick: () => setFilter(s), className: "text-xs", children: [s === 'ALL' ? 'Alle' : STATUS_MAP[s], _jsxs("span", { className: "ml-1.5 opacity-70", children: ["(", counts[s] || 0, ")"] })] }, s));
                        }) })] }), appointments.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "py-8 text-center", children: [_jsx("p", { className: "text-muted-foreground", children: "Sie haben noch keine Termine." }), _jsx(Button, { className: "mt-4", onClick: () => window.location.href = '/patient/book', children: "Termin buchen" })] }) })), filtered.length === 0 && appointments.length > 0 && (_jsx(Card, { children: _jsx(CardContent, { className: "py-8 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "Keine Termine mit diesem Status." }) }) })), _jsx("div", { className: "space-y-3", children: filtered.map((a) => (_jsx(Card, { children: _jsxs(CardContent, { className: "py-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: [a.date, " um ", a.time] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [CATEGORY_LABEL[a.category] || a.category, " bei Dr. ", a.doctor_last_name, a.series_dose_number && _jsxs("span", { className: "ml-2", children: ["(Dosis ", a.series_dose_number, ")"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [a.status === 'PENDING_CONFIRMATION' && (_jsx(Button, { size: "sm", onClick: () => handleConfirmSeries(a.id), children: "Best\u00E4tigen" })), _jsx(Badge, { variant: STATUS_BADGE[a.status] || 'outline', children: STATUS_MAP[a.status] || a.status })] })] }) }, a.id))) })] }));
}
