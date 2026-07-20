import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Syringe } from 'lucide-react';
import { get } from '@/lib/api';
const STATUS_LABEL = {
    SCHEDULED: 'Geplant',
    PENDING_CONFIRMATION: 'Ausstehend',
    COMPLETED: 'Abgeschlossen',
    CHECKED_IN: 'Eingecheckt',
    IN_PROGRESS: 'In Behandlung',
    CANCELLED: 'Storniert',
};
export default function MFAVaccinations() {
    const [vaccinations, setVaccinations] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([
            get('/mfa/vaccinations'),
            get('/vaccination-series'),
        ]).then(([vRes, tRes]) => {
            if (vRes.success && vRes.data)
                setVaccinations(vRes.data);
            if (tRes.success && tRes.data)
                setTemplates(tRes.data);
            setLoading(false);
        });
    }, []);
    if (loading) {
        return _jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Impfungen" }), _jsx("p", { className: "text-muted-foreground", children: "Lade..." })] });
    }
    const seriesAppointments = vaccinations.filter((v) => v.series_group_id);
    const singleVaccinations = vaccinations.filter((v) => !v.series_group_id);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h1", { className: "text-2xl font-semibold", children: "Impfungen" }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(Syringe, { className: "h-4 w-4" }), "Impfserien-Vorlagen"] }), _jsx(CardDescription, { children: "Verf\u00FCgbare Impfserien und Dosierungsschemata" })] }), _jsxs(CardContent, { children: [templates.length === 0 && _jsx("p", { className: "text-sm text-muted-foreground", children: "Keine Vorlagen verf\u00FCgbar." }), _jsx("div", { className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3", children: templates.map((t) => (_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("div", { className: "font-medium text-sm", children: t.name }), _jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [t.doses, " Dosen"] }), _jsx("div", { className: "text-xs text-muted-foreground", children: t.description })] }, t.id))) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(FlaskConical, { className: "h-4 w-4" }), "Impftermine"] }), _jsx(CardDescription, { children: "Alle Impftermine - einzeln und als Serie" })] }), _jsxs(CardContent, { children: [vaccinations.length === 0 && _jsx("p", { className: "text-sm text-muted-foreground", children: "Keine Impftermine vorhanden." }), _jsx("div", { className: "space-y-2", children: vaccinations.map((v) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3 text-sm", children: [_jsxs("div", { children: [_jsxs("div", { className: "font-medium", children: [v.patient_last_name, ", ", v.patient_first_name, " (", v.insurance_number, ")"] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [v.date, " um ", v.time, " \u00B7 Dr. ", v.doctor_last_name, v.series_dose_number && _jsxs("span", { children: [" \u00B7 Dosis ", v.series_dose_number] })] })] }), _jsx(Badge, { variant: "outline", className: "text-xs", children: STATUS_LABEL[v.status] || v.status })] }, v.id))) })] })] })] }));
}
