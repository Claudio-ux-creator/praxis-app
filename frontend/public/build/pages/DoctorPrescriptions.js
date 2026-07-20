import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Pill, Calendar, CheckCircle, XCircle } from "lucide-react";
import { get, post, patch } from "@/lib/api";
const STATUS_MAP = {
    PENDING: "Ausstehend",
    IN_PROGRESS: "In Prüfung",
    APPROVED: "Freigegeben",
    REJECTED: "Abgelehnt",
    COLLECTED: "Abgeholt",
};
const STATUS_BADGE = {
    PENDING: "secondary",
    IN_PROGRESS: "default",
    APPROVED: "default",
    REJECTED: "destructive",
    COLLECTED: "outline",
};
export default function DoctorPrescriptions() {
    const navigate = useNavigate();
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [filter, setFilter] = useState("PENDING");
    const [loading, setLoading] = useState(true);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    // New prescription form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newInsurance, setNewInsurance] = useState("");
    const [newMedication, setNewMedication] = useState("");
    const [newDosage, setNewDosage] = useState("");
    const [newNotes, setNewNotes] = useState("");
    useEffect(() => {
        const stored = localStorage.getItem("doctor_info");
        if (stored) {
            setDoctorInfo(JSON.parse(stored));
        }
        else {
            navigate("/doctor-login");
        }
    }, []);
    const loadPrescriptions = () => {
        setLoading(true);
        get("/doctor/prescriptions").then((r) => {
            if (r.success && r.data)
                setPrescriptions(r.data);
            setLoading(false);
        });
    };
    useEffect(() => {
        if (doctorInfo)
            loadPrescriptions();
    }, [doctorInfo]);
    const handleApprove = async (id) => {
        await patch("/doctor/prescriptions/" + id + "/approve", { status: "APPROVED" });
        loadPrescriptions();
    };
    const handleReject = async (id) => {
        await patch("/doctor/prescriptions/" + id + "/approve", { status: "REJECTED", rejectReason });
        setRejectModal(null);
        setRejectReason("");
        loadPrescriptions();
    };
    const handleCreate = async () => {
        if (!newInsurance || !newMedication || !doctorInfo)
            return;
        const r = await post("/doctor/prescriptions", {
            insuranceNumber: newInsurance,
            medicationName: newMedication,
            dosage: newDosage,
            notes: newNotes,
            doctorId: doctorInfo.id,
        });
        if (r.success) {
            setShowNewForm(false);
            setNewInsurance("");
            setNewMedication("");
            setNewDosage("");
            setNewNotes("");
            loadPrescriptions();
        }
    };
    const filtered = filter === "ALL" ? prescriptions : prescriptions.filter((p) => p.status === filter);
    const counts = {};
    for (const p of prescriptions)
        counts[p.status] = (counts[p.status] || 0) + 1;
    counts["ALL"] = prescriptions.length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Rezept-Freigabe" }), _jsxs("div", { className: "flex gap-1 flex-wrap", children: [["ALL", "PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "COLLECTED"].map((s) => {
                                if (!counts[s] && s !== "ALL")
                                    return null;
                                return (_jsxs(Button, { size: "sm", variant: filter === s ? "default" : "outline", onClick: () => setFilter(s), className: "text-xs", children: [s === "ALL" ? "Alle" : STATUS_MAP[s], _jsxs("span", { className: "ml-1.5 opacity-70", children: ["(", counts[s] || 0, ")"] })] }, s));
                            }), _jsx(Button, { size: "sm", variant: "outline", className: "ml-2", onClick: () => setShowNewForm(!showNewForm), children: "+ Neues Rezept" })] })] }), showNewForm && (_jsxs(Card, { className: "border-primary", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Neues Rezept ausstellen" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Versichertennummer" }), _jsx(Input, { value: newInsurance, onChange: (e) => setNewInsurance(e.target.value), placeholder: "z. B. A123456789" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Medikament" }), _jsx(Input, { value: newMedication, onChange: (e) => setNewMedication(e.target.value), placeholder: "Medikamentname" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Dosierung" }), _jsx(Input, { value: newDosage, onChange: (e) => setNewDosage(e.target.value), placeholder: "z. B. 500 mg" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Notizen" }), _jsx(Input, { value: newNotes, onChange: (e) => setNewNotes(e.target.value), placeholder: "Optional" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowNewForm(false), children: "Abbrechen" }), _jsx(Button, { onClick: handleCreate, children: "Rezept ausstellen" })] })] })] })), loading && _jsx("p", { className: "text-muted-foreground", children: "Lade Rezepte..." }), _jsx("div", { className: "space-y-3", children: filtered.map((p) => (_jsx(Card, { children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "font-medium", children: [p.patient_last_name, ", ", p.patient_first_name] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(", p.insurance_number, ")"] })] }), _jsxs("div", { className: "flex items-center gap-3 text-sm text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Pill, { className: "h-3.5 w-3.5" }), p.medication_name, p.dosage && _jsxs("span", { className: "ml-1", children: ["(", p.dosage, ")"] })] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "h-3.5 w-3.5" }), p.request_date] })] }), p.notes && _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["Notiz: ", p.notes] }), p.last_consultation && ((() => {
                                            const lastConsult = new Date(p.last_consultation);
                                            const oneYearAgo = new Date();
                                            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                                            const isOld = lastConsult < oneYearAgo;
                                            return (_jsxs("p", { className: "text-xs mt-1", children: ["Letzte Konsultation: ", p.last_consultation, isOld ? ' ⚠️ > 1 Jahr her – Freigabe nicht möglich' : ' ✅ < 1 Jahr'] }));
                                        })()), !p.last_consultation && (_jsx("p", { className: "text-xs mt-1 text-destructive font-semibold", children: "Keine Konsultation bekannt \u2013 Freigabe nicht m\u00F6glich" }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [p.status === "PENDING" && (_jsxs(_Fragment, { children: [_jsxs(Button, { size: "sm", variant: "default", onClick: () => handleApprove(p.id), children: [_jsx(CheckCircle, { className: "h-3.5 w-3.5 mr-1" }), " Freigeben"] }), _jsxs(Button, { size: "sm", variant: "destructive", onClick: () => setRejectModal(p.id), children: [_jsx(XCircle, { className: "h-3.5 w-3.5 mr-1" }), " Ablehnen"] })] })), _jsx(Badge, { variant: (STATUS_BADGE[p.status] || "outline"), children: STATUS_MAP[p.status] || p.status })] })] }) }) }, p.id))) }), rejectModal !== null && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs(Card, { className: "w-full max-w-md mx-4", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Rezept ablehnen" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Grund der Ablehnung" }), _jsx(Textarea, { value: rejectReason, onChange: (e) => setRejectReason(e.target.value), placeholder: "Bitte Grund angeben..." })] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "outline", onClick: () => setRejectModal(null), children: "Abbrechen" }), _jsx(Button, { variant: "destructive", onClick: () => handleReject(rejectModal), children: "Ablehnen" })] })] })] }) }))] }));
}
