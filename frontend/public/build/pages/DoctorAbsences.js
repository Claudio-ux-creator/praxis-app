import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { get, post, del } from "@/lib/api";
export default function DoctorAbsences() {
    const navigate = useNavigate();
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [absences, setAbsences] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [type, setType] = useState("VACATION");
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    useEffect(() => {
        const stored = localStorage.getItem("doctor_info");
        if (stored) {
            setDoctorInfo(JSON.parse(stored));
        }
        else {
            navigate("/doctor-login");
        }
    }, []);
    const loadData = () => {
        setLoading(true);
        Promise.all([
            get("/doctor/absences"),
            get("/doctors"),
        ]).then(([a, d]) => {
            if (a.success && a.data)
                setAbsences(a.data);
            if (d.success && d.data)
                setDoctors(d.data);
            setLoading(false);
        });
    };
    useEffect(() => { if (doctorInfo)
        loadData(); }, [doctorInfo]);
    const handleCreate = async () => {
        if (!startDate || !endDate || selectedDoctors.length === 0)
            return;
        const r = await post("/doctor/absences", {
            type,
            doctorIds: selectedDoctors,
            startDate,
            endDate,
            reason: reason || undefined,
            blocksBooking: true,
        });
        if (r.success) {
            setShowForm(false);
            setType("VACATION");
            setSelectedDoctors([]);
            setStartDate("");
            setEndDate("");
            setReason("");
            loadData();
        }
    };
    const handleDelete = async (id) => {
        const r = await del("/doctor/absences/" + id);
        if (r.success)
            loadData();
    };
    const toggleDoctor = (id) => {
        setSelectedDoctors((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
    };
    const typeLabels = {
        VACATION: "Urlaub",
        SICKNESS: "Krankheit",
        TRAINING: "Fortbildung",
        OTHER: "Sonstiges",
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Urlaub & Abwesenheit" }), _jsxs(Button, { onClick: () => setShowForm(!showForm), children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), " Abwesenheit eintragen"] })] }), showForm && (_jsxs(Card, { className: "border-primary", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Neue Abwesenheit" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Typ" }), _jsx("select", { className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm", value: type, onChange: (e) => setType(e.target.value), children: Object.entries(typeLabels).map(([k, v]) => (_jsx("option", { value: k, children: v }, k))) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Betroffene \u00C4rzte" }), _jsx("div", { className: "flex flex-wrap gap-1", children: doctors.map((doc) => (_jsxs(Button, { type: "button", size: "sm", variant: selectedDoctors.includes(doc.id) ? "default" : "outline", onClick: () => toggleDoctor(doc.id), children: ["Dr. ", doc.last_name] }, doc.id))) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Startdatum" }), _jsx(Input, { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Enddatum" }), _jsx(Input, { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value) })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Grund (optional)" }), _jsx(Textarea, { value: reason, onChange: (e) => setReason(e.target.value), placeholder: "Grund der Abwesenheit..." })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Abbrechen" }), _jsx(Button, { onClick: handleCreate, children: "Speichern" })] })] })] })), loading && _jsx("p", { className: "text-muted-foreground", children: "Lade Abwesenheiten..." }), _jsxs("div", { className: "space-y-3", children: [absences.length === 0 && !loading && (_jsx(Card, { children: _jsx(CardContent, { className: "py-8 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "Keine Abwesenheiten eingetragen." }) }) })), absences.map((a) => (_jsx(Card, { children: _jsxs(CardContent, { className: "py-4 flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CalendarDays, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "font-medium", children: [a.start_date, " bis ", a.end_date] }), _jsx(Badge, { variant: "secondary", children: typeLabels[a.type] || a.type }), a.blocks_booking === 1 && _jsx(Badge, { variant: "outline", children: "Keine Buchung" })] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["\u00C4rzte: ", a.doctor_ids.split(",").map((id) => {
                                                    const doc = doctors.find((d) => d.id === Number(id));
                                                    return doc ? `Dr. ${doc.last_name}` : id;
                                                }).join(", ")] }), a.reason && _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Grund: ", a.reason] })] }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDelete(a.id), children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] }) }, a.id)))] })] }));
}
