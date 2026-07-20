import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Phone, Mail, AlertTriangle } from 'lucide-react';
import { get } from '@/lib/api';
export default function MFAPatients() {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
        get('/patients').then((r) => {
            if (r.success && r.data)
                setPatients(r.data);
            setLoading(false);
        });
    }, []);
    // Filter by search
    const filtered = patients.filter((p) => {
        if (!search)
            return true;
        const q = search.toLowerCase();
        return (p.insurance_number.toLowerCase().includes(q) ||
            p.first_name.toLowerCase().includes(q) ||
            p.last_name.toLowerCase().includes(q) ||
            p.phone.includes(q));
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Patienten" }), _jsxs("div", { className: "relative w-72", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Suchen (Name, Vers.-Nr., Telefon)...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-9" })] })] }), loading && _jsx("p", { className: "text-muted-foreground", children: "Lade Patienten..." }), !loading && filtered.length === 0 && (_jsx(Card, { children: _jsx(CardContent, { className: "py-8 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "Keine Patienten gefunden." }) }) })), _jsx("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: filtered.map((p) => (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs(CardTitle, { className: "text-base", children: [p.last_name, ", ", p.first_name] }), _jsxs(CardDescription, { children: ["Vers.-Nr.: ", p.insurance_number, ' · ', "geb. ", p.date_of_birth] })] }), _jsxs(CardContent, { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Phone, { className: "h-3.5 w-3.5" }), p.phone] }), p.email && (_jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(Mail, { className: "h-3.5 w-3.5" }), p.email] })), p.no_show_count >= 2 && (_jsxs("div", { className: "flex items-center gap-2 text-destructive text-xs font-medium pt-1", children: [_jsx(AlertTriangle, { className: "h-3.5 w-3.5" }), "No-Shows: ", p.no_show_count] }))] })] }, p.id))) })] }));
}
