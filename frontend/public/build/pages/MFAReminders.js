import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { get, post } from "@/lib/api";
export default function MFAReminders() {
    const [pending, setPending] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState("");
    const [error, setError] = useState("");
    const loadData = async () => {
        setLoading(true);
        const [dashRes, pendRes] = await Promise.all([
            get("/reminders/dashboard"),
            get("/reminders/pending"),
        ]);
        setLoading(false);
        if (dashRes.success && dashRes.data)
            setDashboard(dashRes.data);
        if (pendRes.success && pendRes.data)
            setPending(pendRes.data);
    };
    useEffect(() => { loadData(); }, []);
    const handleProcess = async () => {
        setProcessing(true);
        setError("");
        setStatusMsg("");
        const res = await post("/reminders/process", {});
        setProcessing(false);
        if (res.success && res.data) {
            var d = res.data;
            setStatusMsg("Erinnerungen verarbeitet: " + d.stats.generated + " generiert, " + d.stats.sent + " gesendet");
            loadData();
        }
        else {
            setError(res.error || "Fehler beim Verarbeiten");
        }
    };
    if (loading) {
        return _jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Erinnerungen" }), _jsx("p", { className: "text-muted-foreground", children: "Lade..." })] });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Erinnerungs-Zentrale" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Badge, { variant: "outline", className: "text-sm", children: ["Heute: ", dashboard?.sentToday || 0, " gesendet"] }), _jsxs(Badge, { variant: pending.length > 0 ? "default" : "secondary", className: "text-sm", children: [pending.length, " ausstehend"] })] })] }), error && _jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error }), statusMsg && _jsx("div", { className: "rounded-lg border border-green-500/50 bg-green-50 p-3 text-sm text-green-700", children: statusMsg }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-base", children: "Erinnerungen verarbeiten" }), _jsx(CardDescription, { children: "Generiert 24h-Erinnerungen fuer morgige Termine und sendet alle ausstehenden Erinnerungen (Simulation)." })] }), _jsx(CardContent, { children: _jsx(Button, { onClick: handleProcess, disabled: processing, className: "w-full sm:w-auto", children: processing ? "Verarbeite..." : "Jetzt verarbeiten & senden" }) })] }), pending.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-base", children: ["Ausstehende Erinnerungen (", pending.length, ")"] }) }), _jsx(CardContent, { className: "space-y-2", children: pending.map((r) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3 text-sm", children: [_jsxs("div", { children: [_jsxs("div", { className: "font-medium", children: [r.patient_last_name, ", ", r.patient_first_name] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [r.appointment_date, " um ", r.appointment_time, " Uhr \u00B7 Dr. ", r.doctor_last_name] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: r.type === "24H" ? "24h" : "Same-Day" }), _jsx(Badge, { variant: r.channel === "EMAIL" ? "default" : "secondary", className: "text-xs", children: r.channel }), _jsx(Badge, { variant: "outline", className: "bg-amber-100 text-amber-700", children: "Ausstehend" })] })] }, r.id))) })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-base", children: "Verlauf (letzte 50)" }), _jsx(CardDescription, { children: "Alle gesendeten und ausstehenden Erinnerungen" })] }), _jsxs(CardContent, { className: "space-y-1 max-h-96 overflow-y-auto", children: [dashboard?.recent.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground", children: "Noch keine Erinnerungen." })), dashboard?.recent.map((r) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border p-2 text-xs", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "font-medium", children: [r.patient_last_name, ", ", r.patient_first_name] }), _jsxs("span", { className: "text-muted-foreground", children: [r.appointment_date, " ", r.appointment_time] }), _jsx("span", { className: "text-muted-foreground", children: r.channel })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: "text-[10px] px-1 py-0", children: r.type === "24H" ? "24h" : "Today" }), _jsx(Badge, { className: "text-[10px] px-1 py-0 " + (r.status === "SENT" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"), children: r.status === "SENT" ? "Gesendet" : "Ausstehend" }), r.sent_at && _jsx("span", { className: "text-muted-foreground", children: r.sent_at })] })] }, r.id)))] })] })] }));
}
