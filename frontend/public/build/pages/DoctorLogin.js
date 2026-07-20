import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { post } from "@/lib/api";
export default function DoctorLogin() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const stored = localStorage.getItem("doctor_info");
        if (stored) {
            navigate("/doctor");
        }
    }, []);
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const r = await post("/doctor/login", { firstName, lastName });
            if (r.success && r.data) {
                localStorage.setItem("doctor_info", JSON.stringify(r.data));
                navigate("/doctor");
            }
            else {
                setError(r.error || "Arzt nicht gefunden");
            }
        }
        catch {
            setError("Verbindungsfehler");
        }
        setLoading(false);
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 p-4", children: _jsxs(Card, { className: "w-full max-w-md shadow-lg", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { className: "text-2xl", children: "Arzt-Login" }), _jsx(CardDescription, { children: "Bitte melden Sie sich mit Ihrem Namen an" })] }), _jsxs(CardContent, { children: [_jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "firstName", children: "Vorname" }), _jsx(Input, { id: "firstName", value: firstName, onChange: (e) => setFirstName(e.target.value), placeholder: "z. B. Ahmet", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "lastName", children: "Nachname" }), _jsx(Input, { id: "lastName", value: lastName, onChange: (e) => setLastName(e.target.value), placeholder: "z. B. Demir", required: true })] }), error && _jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive", children: error }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Wird geprüft..." : "Anmelden" })] }), _jsx("div", { className: "mt-4 text-center text-sm text-muted-foreground", children: _jsxs("p", { children: ["Testzugang: ", _jsx("code", { className: "rounded bg-muted px-1.5 py-0.5 text-xs font-mono", children: "Ahmet Demir" })] }) })] })] }) }));
}
