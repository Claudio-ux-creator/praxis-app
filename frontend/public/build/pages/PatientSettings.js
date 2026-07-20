import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { get, patch } from "@/lib/api";
export default function PatientSettings() {
    const [insuranceNumber, setInsuranceNumber] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [patientId, setPatientId] = useState(null);
    const [patientName, setPatientName] = useState("");
    const [email, setEmail] = useState("");
    const [emailOptIn, setEmailOptIn] = useState(false);
    const [phone, setPhone] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const loadSettings = async (id) => {
        const res = await get("/patients/" + id + "/reminder-settings");
        if (res.success && res.data) {
            setEmail(res.data.email || "");
            setEmailOptIn(res.data.email_opt_in === 1);
            setPhone(res.data.phone || "");
        }
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        const storedInsurance = localStorage.getItem("patient_insurance");
        const storedName = localStorage.getItem("patient_name");
        if (storedInsurance && storedName) {
            setInsuranceNumber(storedInsurance);
            setPatientName(storedName);
            setLoggedIn(true);
            const res2 = await fetch("/api/patients/lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ insuranceNumber: storedInsurance }),
            }).then((r) => r.json());
            if (res2.success && res2.data) {
                loadSettings(res2.data.id);
            }
            return;
        }
        setLoading(true);
        const res = await fetch("/api/patients/lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ insuranceNumber, dateOfBirth: dateOfBirth || undefined }),
        }).then((r) => r.json());
        setLoading(false);
        if (res.success && res.data) {
            setPatientId(res.data.id);
            setPatientName(res.data.first_name + " " + res.data.last_name);
            setLoggedIn(true);
            loadSettings(res.data.id);
        }
        else {
            setError(res.error || "Patient nicht gefunden");
        }
    };
    const handleSave = async () => {
        if (!patientId)
            return;
        setError("");
        setSuccessMsg("");
        setSaving(true);
        const res = await patch("/patients/" + patientId + "/reminder-settings", { email, emailOptIn });
        setSaving(false);
        if (res.success) {
            setSuccessMsg("Einstellungen gespeichert");
            setTimeout(() => setSuccessMsg(""), 3000);
        }
        else {
            setError(res.error || "Fehler beim Speichern");
        }
    };
    if (!loggedIn) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Einstellungen" }), _jsxs(Card, { className: "max-w-md", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Patienten-Login" }), _jsx(CardDescription, { children: "Geben Sie Ihre Versichertennummer ein, um Ihre Einstellungen zu verwalten." })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "insurance", children: "Versichertennummer" }), _jsx(Input, { id: "insurance", value: insuranceNumber, onChange: (e) => setInsuranceNumber(e.target.value), placeholder: "z. B. A123456789", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dob", children: "Geburtsdatum (optional)" }), _jsx(Input, { id: "dob", type: "date", value: dateOfBirth, onChange: (e) => setDateOfBirth(e.target.value) })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Wird geladen..." : "Weiter" })] }) })] })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Einstellungen" }), _jsx(Badge, { variant: "outline", className: "text-sm", children: patientName })] }), error && _jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error }), successMsg && _jsx("div", { className: "rounded-lg border border-green-500/50 bg-green-50 p-3 text-sm text-green-700", children: successMsg }), _jsxs(Card, { className: "max-w-lg", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-base", children: "Benachrichtigungen & Kontakt" }), _jsx(CardDescription, { children: "Verwalten Sie Ihre Kontaktdaten und entscheiden Sie, ob Sie Erinnerungen erhalten moechten." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "E-Mail-Adresse" }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "max@example.com" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phone", children: "Telefonnummer" }), _jsx(Input, { id: "phone", type: "tel", value: phone, disabled: true }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Die Telefonnummer kann nur in der Praxis geaendert werden." })] }), _jsxs("div", { className: "flex items-center gap-3 rounded-lg border p-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-medium", children: "E-Mail-Erinnerungen" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Sie erhalten 24 Stunden vor Ihrem Termin eine Erinnerung per E-Mail." })] }), _jsx(Button, { size: "sm", variant: emailOptIn ? "default" : "outline", onClick: () => setEmailOptIn(!emailOptIn), disabled: !email, children: emailOptIn ? "Aktiviert" : "Deaktiviert" })] }), _jsx(Button, { onClick: handleSave, disabled: saving, className: "w-full", children: saving ? "Wird gespeichert..." : "Einstellungen speichern" })] })] }), _jsxs(Card, { className: "max-w-lg", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-base", children: "Informationen zu Erinnerungen" }), _jsx(CardDescription, { children: "Wie wir Sie benachrichtigen" })] }), _jsxs(CardContent, { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "mt-0.5 text-lg", children: "\uD83D\uDCE7" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "24h-Erinnerung" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Am Vortag Ihres Termins erhalten Sie eine E-Mail mit Datum, Uhrzeit und Arzt." })] })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "mt-0.5 text-lg", children: "\uD83D\uDD12" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Keine Speicherung" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Ihre Daten werden nur zur Terminverwaltung genutzt und nicht an Dritte weitergegeben." })] })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("span", { className: "mt-0.5 text-lg", children: "\uD83D\uDCE7" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "DSGVO-konform" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Sie koennen Ihre Einwilligung jederzeit widerrufen." })] })] })] })] })] }));
}
