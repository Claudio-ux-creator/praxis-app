import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill } from 'lucide-react';
import { get, patch } from '@/lib/api';
const STATUS_MAP = {
    PENDING: 'Ausstehend',
    IN_PROGRESS: 'In PrÃ¼fung',
    APPROVED: 'Freigegeben',
    REJECTED: 'Abgelehnt',
    COLLECTED: 'Abgeholt',
};
const STATUS_BADGE = {
    PENDING: 'secondary',
    IN_PROGRESS: 'default',
    APPROVED: 'default',
    REJECTED: 'destructive',
    COLLECTED: 'outline',
};
const RX_NEXT_STATUS = {
    PENDING: ['IN_PROGRESS'],
    IN_PROGRESS: [],
    APPROVED: ['COLLECTED'],
    REJECTED: [],
    COLLECTED: [],
};
export default function MFAPrescriptions() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [filter, setFilter] = useState('PENDING');
    const [loading, setLoading] = useState(true);
    const loadData = () => {
        setLoading(true);
        get('/prescriptions/all').then((r) => {
            if (r.success && r.data)
                setPrescriptions(r.data);
            setLoading(false);
        });
    };
    useEffect(() => { loadData(); }, []);
    const handleStatusChange = async (id, newStatus) => {
        await patch('/prescriptions/' + id + '/status', { status: newStatus });
        loadData();
    };
    const filtered = filter === 'ALL'
        ? prescriptions
        : prescriptions.filter((p) => p.status === filter);
    const counts = {};
    for (const p of prescriptions) {
        counts[p.status] = (counts[p.status] || 0) + 1;
    }
    counts['ALL'] = prescriptions.length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Rezeptverwaltung" }), _jsx("div", { className: "flex gap-1 flex-wrap", children: ['ALL', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COLLECTED'].map((s) => {
                            if (!counts[s])
                                return null;
                            return (_jsxs(Button, { size: "sm", variant: filter === s ? 'default' : 'outline', onClick: () => setFilter(s), className: "text-xs", children: [s === 'ALL' ? 'Alle' : STATUS_MAP[s], _jsxs("span", { className: "ml-1 opacity-70", children: ["(", counts[s], ")"] })] }, s));
                        }) })] }), loading && _jsx("p", { className: "text-muted-foreground", children: "Lade Rezepte..." }), !loading && filtered.length === 0 && (_jsx(Card, { children: _jsx(CardContent, { className: "py-8 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "Keine Rezepte gefunden." }) }) })), _jsx("div", { className: "space-y-3", children: filtered.map((rx) => (_jsx(Card, { children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Pill, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "font-medium", children: rx.medication_name }), rx.dosage && (_jsxs("span", { className: "text-sm text-muted-foreground", children: ["(", rx.dosage, ")"] }))] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [rx.patient_last_name, ", ", rx.patient_first_name, " (", rx.insurance_number, ")", ' Â· ', "Dr. ", rx.doctor_last_name, ' Â· ', "angefragt: ", rx.request_date] }), rx.notes && (_jsx("div", { className: "text-xs italic bg-muted p-2 rounded inline-block", children: rx.notes })), rx.status !== 'COLLECTED' && rx.status !== 'REJECTED' && (_jsx("div", { className: "flex gap-1 pt-1", children: RX_NEXT_STATUS[rx.status]?.map((ns) => (_jsx(Button, { size: "xs", variant: ns === 'APPROVED' ? 'default' :
                                                    ns === 'REJECTED' ? 'destructive' : 'outline', onClick: () => handleStatusChange(rx.id, ns), className: "text-xs", children: ns === 'IN_PROGRESS' ? 'PrÃ¼fen' :
                                                    ns === 'APPROVED' ? 'Freigeben' :
                                                        ns === 'REJECTED' ? 'Ablehnen' :
                                                            ns === 'COLLECTED' ? 'Abgeholt' : ns }, ns))) }))] }), _jsx(Badge, { variant: (STATUS_BADGE[rx.status] || 'outline'), children: STATUS_MAP[rx.status] || rx.status })] }) }) }, rx.id))) })] }));
}
