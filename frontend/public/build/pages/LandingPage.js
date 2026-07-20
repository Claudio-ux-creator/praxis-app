import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function LandingPage() {
    const navigate = useNavigate();
    const [insuranceNumber, setInsuranceNumber] = useState("A123456789");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/patients/lookup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ insuranceNumber, dateOfBirth: dateOfBirth || undefined }),
            }).then((r) => r.json());
            if (res.success && res.data) {
                localStorage.setItem("patient_insurance", insuranceNumber);
                localStorage.setItem("patient_name", res.data.first_name + " " + res.data.last_name);
                navigate("/patient");
            }
            else {
                setError(res.error || "Patient nicht gefunden");
            }
        }
        catch {
            setError("Verbindungsfehler");
        }
        setLoading(false);
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4", children: _jsxs(Card, { className: "w-full max-w-md shadow-lg", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { className: "text-2xl", children: "Praxis Demir & Kollegen" }), _jsx(CardDescription, { children: "Online-Terminverwaltung" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "insuranceNumber", children: "Versichertennummer" }), _jsx(Input, { id: "insuranceNumber", value: insuranceNumber, onChange: (e) => setInsuranceNumber(e.target.value), placeholder: "z. B. A123456789", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dob", children: "Geburtsdatum (optional)" }), _jsx(Input, { id: "dob", type: "date", value: dateOfBirth, onChange: (e) => setDateOfBirth(e.target.value) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Nur erforderlich bei mehreren Patienten mit gleicher Versichertennummer." })] }), error && _jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive", children: error }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Wird geprüft..." : "Anmelden" })] }), _jsxs("div", { className: "mt-4 space-y-2 text-center text-sm text-muted-foreground", children: [_jsxs("p", { children: ["Testzugang: ", _jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-xs font-mono", children: "A123456789" })] }), _jsx("p", { children: _jsx("a", { href: "/mfa", className: "text-primary underline", children: "MFA-Login" }) }), _jsx("p", { children: _jsx("a", { href: "/doctor-login", className: "text-primary underline", children: "Arzt-Login" }) })] })] })] }) }));
}
