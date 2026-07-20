import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { get } from '@/lib/api';
const STATUS_MAP = {
    PENDING: 'Ausstehend',
    APPROVED: 'Freigegeben',
    REJECTED: 'Abgelehnt',
    DISPENSED: 'Ausgegeben',
};
const STATUS_BADGE = {
    PENDING: 'secondary',
    APPROVED: 'default',
    REJECTED: 'destructive',
    DISPENSED: 'outline',
};
export default function PatientPrescriptions() {
    const insuranceNumber = localStorage.getItem('patient_insurance') || '';
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!insuranceNumber)
            return;
        setLoading(true);
        get('/prescriptions?insuranceNumber=' + insuranceNumber).then((r) => {
            if (r.success && r.data)
                setPrescriptions(r.data);
            setLoading(false);
        });
    }, [insuranceNumber]);
    if (loading) {
        return _jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "Lade Rezepte..." }) });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Meine Rezepte" }), prescriptions.length === 0 && (_jsx(Card, { children: _jsx(CardContent, { className: "py-8 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "Sie haben noch keine Rezepte." }) }) })), _jsx("div", { className: "space-y-3", children: prescriptions.map((p) => (_jsx(Card, { children: _jsxs(CardContent, { className: "py-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: p.medication_name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [p.dosage && _jsxs("span", { children: ["Dosierung: ", p.dosage, " \u00B7 "] }), "Dr. ", p.doctor_last_name, ' — ', p.request_date] }), p.notes && _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: p.notes })] }), _jsx(Badge, { variant: STATUS_BADGE[p.status] || 'outline', children: STATUS_MAP[p.status] || p.status })] }) }, p.id))) })] }));
}
