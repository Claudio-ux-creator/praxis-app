import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search, Stethoscope, Pill } from "lucide-react";
import { get, post, patch, del } from "@/lib/api";
export default function DoctorMasterData() {
    const navigate = useNavigate();
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [medications, setMedications] = useState([]);
    const [diagnoses, setDiagnoses] = useState([]);
    const [medSearch, setMedSearch] = useState("");
    const [diagSearch, setDiagSearch] = useState("");
    // Medication form
    const [showMedForm, setShowMedForm] = useState(false);
    const [editMedId, setEditMedId] = useState(null);
    const [medName, setMedName] = useState("");
    const [medIngredient, setMedIngredient] = useState("");
    const [medStrength, setMedStrength] = useState("");
    const [medForm, setMedForm] = useState("");
    // Diagnosis form
    const [showDiagForm, setShowDiagForm] = useState(false);
    const [diagInsurance, setDiagInsurance] = useState("");
    const [diagIcd, setDiagIcd] = useState("");
    const [diagText, setDiagText] = useState("");
    const [diagDate, setDiagDate] = useState("");
    const [diagNotes, setDiagNotes] = useState("");
    useEffect(() => {
        const stored = localStorage.getItem("doctor_info");
        if (!stored) {
            navigate("/doctor-login");
            return;
        }
        setDoctorInfo(JSON.parse(stored));
        loadMedications();
        loadDiagnoses();
    }, []);
    const loadMedications = () => {
        get("/doctor/medications").then((r) => {
            if (r.success && r.data)
                setMedications(r.data);
        });
    };
    const loadDiagnoses = () => {
        get("/doctor/diagnoses").then((r) => {
            if (r.success && r.data)
                setDiagnoses(r.data);
        });
    };
    const handleMedSave = async () => {
        if (!medName)
            return;
        if (editMedId) {
            await patch("/doctor/medications/" + editMedId, { name: medName, activeIngredient: medIngredient, strength: medStrength, form: medForm });
        }
        else {
            await post("/doctor/medications", { name: medName, activeIngredient: medIngredient, strength: medStrength, form: medForm });
        }
        resetMedForm();
        loadMedications();
    };
    const handleMedEdit = (m) => {
        setEditMedId(m.id);
        setMedName(m.name);
        setMedIngredient(m.active_ingredient || "");
        setMedStrength(m.strength || "");
        setMedForm(m.form || "");
        setShowMedForm(true);
    };
    const handleMedDelete = async (id) => {
        await del("/doctor/medications/" + id);
        loadMedications();
    };
    const resetMedForm = () => {
        setShowMedForm(false);
        setEditMedId(null);
        setMedName("");
        setMedIngredient("");
        setMedStrength("");
        setMedForm("");
    };
    const handleDiagSave = async () => {
        if (!diagInsurance || !diagIcd || !diagText || !doctorInfo)
            return;
        const r = await post("/doctor/diagnoses", {
            insuranceNumber: diagInsurance,
            icdCode: diagIcd,
            diagnosisText: diagText,
            diagnosisDate: diagDate || undefined,
            notes: diagNotes || undefined,
            doctorId: doctorInfo.id,
        });
        if (r.success) {
            setShowDiagForm(false);
            setDiagInsurance("");
            setDiagIcd("");
            setDiagText("");
            setDiagDate("");
            setDiagNotes("");
            loadDiagnoses();
        }
    };
    const filteredMeds = medications.filter((m) => m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
        (m.active_ingredient && m.active_ingredient.toLowerCase().includes(medSearch.toLowerCase())));
    const filteredDiagnoses = diagnoses.filter((d) => d.icd_code.toLowerCase().includes(diagSearch.toLowerCase()) ||
        d.diagnosis_text.toLowerCase().includes(diagSearch.toLowerCase()) ||
        d.patient_last_name.toLowerCase().includes(diagSearch.toLowerCase()));
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Stammdaten" }), _jsxs(Tabs, { defaultValue: "medications", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "medications", children: [_jsx(Pill, { className: "h-4 w-4 mr-1" }), " Medikamente"] }), _jsxs(TabsTrigger, { value: "diagnoses", children: [_jsx(Stethoscope, { className: "h-4 w-4 mr-1" }), " Diagnosen"] })] }), _jsxs(TabsContent, { value: "medications", className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "relative flex-1 max-w-sm", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { className: "pl-8", placeholder: "Medikament suchen...", value: medSearch, onChange: (e) => setMedSearch(e.target.value) })] }), _jsxs(Button, { onClick: () => { resetMedForm(); setShowMedForm(true); }, children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), " Medikament hinzuf\u00FCgen"] })] }), showMedForm && (_jsxs(Card, { className: "border-primary", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: editMedId ? "Medikament bearbeiten" : "Neues Medikament" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Name *" }), _jsx(Input, { value: medName, onChange: (e) => setMedName(e.target.value) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Wirkstoff" }), _jsx(Input, { value: medIngredient, onChange: (e) => setMedIngredient(e.target.value) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "St\u00E4rke" }), _jsx(Input, { value: medStrength, onChange: (e) => setMedStrength(e.target.value) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Form" }), _jsx(Input, { value: medForm, onChange: (e) => setMedForm(e.target.value) })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: resetMedForm, children: "Abbrechen" }), _jsx(Button, { onClick: handleMedSave, children: "Speichern" })] })] })] })), _jsx("div", { className: "grid gap-2 md:grid-cols-2", children: filteredMeds.map((m) => (_jsx(Card, { children: _jsxs(CardContent, { className: "py-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: m.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [m.active_ingredient && `${m.active_ingredient}`, m.strength && ` – ${m.strength}`, m.form && ` – ${m.form}`] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleMedEdit(m), children: _jsx(Pencil, { className: "h-3.5 w-3.5" }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleMedDelete(m.id), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" }) })] })] }) }, m.id))) })] }), _jsxs(TabsContent, { value: "diagnoses", className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "relative flex-1 max-w-sm", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { className: "pl-8", placeholder: "Diagnose suchen...", value: diagSearch, onChange: (e) => setDiagSearch(e.target.value) })] }), _jsxs(Button, { onClick: () => setShowDiagForm(!showDiagForm), children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), " Diagnose hinzuf\u00FCgen"] })] }), showDiagForm && (_jsxs(Card, { className: "border-primary", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Neue Diagnose" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Versichertennummer *" }), _jsx(Input, { value: diagInsurance, onChange: (e) => setDiagInsurance(e.target.value), placeholder: "A123456789" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "ICD-Code *" }), _jsx(Input, { value: diagIcd, onChange: (e) => setDiagIcd(e.target.value), placeholder: "z. B. J06.9" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Diagnosetext *" }), _jsx(Input, { value: diagText, onChange: (e) => setDiagText(e.target.value), placeholder: "Diagnosebeschreibung" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Datum" }), _jsx(Input, { type: "date", value: diagDate, onChange: (e) => setDiagDate(e.target.value) })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Notizen" }), _jsx(Textarea, { value: diagNotes, onChange: (e) => setDiagNotes(e.target.value) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowDiagForm(false), children: "Abbrechen" }), _jsx(Button, { onClick: handleDiagSave, children: "Speichern" })] })] })] })), _jsx("div", { className: "space-y-2", children: filteredDiagnoses.map((d) => (_jsx(Card, { children: _jsx(CardContent, { className: "py-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "secondary", children: d.icd_code }), _jsx("span", { className: "font-medium", children: d.diagnosis_text })] }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["Patient: ", d.patient_last_name, ", ", d.patient_first_name, " (", d.insurance_number, ") \u2013 ", d.diagnosis_date] }), d.notes && _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Notiz: ", d.notes] })] }), _jsx("div", { className: "flex gap-1", children: _jsx(Button, { size: "sm", variant: "ghost", children: _jsx(Pencil, { className: "h-3.5 w-3.5" }) }) })] }) }) }, d.id))) })] })] })] }));
}
