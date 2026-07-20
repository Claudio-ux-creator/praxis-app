import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { get, post, patch } from "@/lib/api";
import { useLocation, useNavigate } from "react-router-dom";
const CATEGORIES = [
    { value: "CHECKUP", label: "Vorsorge", icon: "🩺" },
    { value: "CONSULTATION", label: "Beratung", icon: "💬" },
    { value: "VACCINATION", label: "Impfung", icon: "💉" },
    { value: "PRESCRIPTION_PICKUP", label: "Rezept-Abholung", icon: "💊" },
];
const STATUS_MAP = {
    SCHEDULED: "Gebucht",
    PENDING_CONFIRMATION: "Bestätigung ausstehend",
    CHECKED_IN: "Eingecheckt",
    IN_PROGRESS: "In Behandlung",
    COMPLETED: "Abgeschlossen",
    CANCELLED: "Storniert",
    NO_SHOW: "Nicht erschienen",
};
const CATEGORY_LABEL = {
    CHECKUP: "Vorsorge",
    CONSULTATION: "Beratung",
    VACCINATION: "Impfung",
    PRESCRIPTION_PICKUP: "Rezept-Abholung",
    ACUTE: "Akut",
};
export default function PatientPortal() {
    // Login
    const [insuranceNumber, setInsuranceNumber] = useState(localStorage.getItem("patient_insurance") || "");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [patientName, setPatientName] = useState(localStorage.getItem("patient_name") || "");
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = location.pathname;
    // Booking state
    const [step, setStep] = useState(localStorage.getItem("patient_insurance") ? "category" : "login");
    const [category, setCategory] = useState("");
    const [bookingMode, setBookingMode] = useState("single");
    const [seriesTemplates, setSeriesTemplates] = useState([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [doctorId, setDoctorId] = useState(null);
    const [date, setDate] = useState(undefined);
    const [slots, setSlots] = useState([]);
    const [time, setTime] = useState("");
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);
    // My appointments
    const [myAppointments, setMyAppointments] = useState([]);
    const [showAppointments, setShowAppointments] = useState(false);
    useEffect(() => {
        const storedInsurance = localStorage.getItem("patient_insurance");
        const storedName = localStorage.getItem("patient_name");
        if (storedInsurance && storedName) {
            setInsuranceNumber(storedInsurance);
            setPatientName(storedName);
            setStep("category");
            get("/appointments?insuranceNumber=" + storedInsurance).then((res) => {
                if (res.success && res.data)
                    setMyAppointments(res.data);
            });
        }
    }, []);
    useEffect(() => {
        get("/doctors").then((res) => {
            if (res.success && res.data)
                setDoctors(res.data);
        });
        get("/vaccination-series").then((res) => {
            if (res.success && res.data)
                setSeriesTemplates(res.data);
        });
    }, []);
    // Load questions when category changes
    useEffect(() => {
        if (!category)
            return;
        get("/questions?category=" + category).then((res) => {
            if (res.success && res.data) {
                setQuestions(res.data);
                setAnswers(res.data.map((q) => ({
                    questionId: q.id,
                    questionText: q.question_text,
                    answer: "",
                })));
            }
            else {
                setQuestions([]);
                setAnswers([]);
            }
        });
    }, [category]);
    // Load appointments
    const loadAppointments = useCallback(async () => {
        if (!insuranceNumber)
            return;
        const res = await get("/appointments?insuranceNumber=" + insuranceNumber);
        if (res.success && res.data) {
            setMyAppointments(res.data);
        }
    }, [insuranceNumber]);
    // Patient-Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const res = await post("/patients/lookup", {
            insuranceNumber,
            dateOfBirth: dateOfBirth || undefined,
        });
        setLoading(false);
        if (res.success && res.data) {
            setPatientName(res.data.first_name + " " + res.data.last_name);
            localStorage.setItem("patient_insurance", insuranceNumber);
            localStorage.setItem("patient_name", res.data.first_name + " " + res.data.last_name);
            setStep("category");
            loadAppointments();
        }
        else {
            setError(res.error || "Patient nicht gefunden");
        }
    };
    // Select category
    const handleCategory = (val) => {
        setCategory(val);
        setBookingMode("single");
        setSelectedSeriesId(null);
        setDoctorId(null);
        setDate(undefined);
        setSlots([]);
        setTime("");
        if (val === "VACCINATION") {
            setStep("seriesChoice");
        }
        else {
            setStep("doctor");
        }
    };
    // Select booking mode for vaccination
    const handleSeriesChoice = (mode) => {
        setBookingMode(mode);
        if (mode === "series") {
            setStep("seriesTemplate");
        }
        else {
            setStep("doctor");
        }
    };
    // Select series template
    const handleSeriesTemplate = (id) => {
        setSelectedSeriesId(id);
        setStep("doctor");
    };
    // Select doctor
    const handleDoctor = (id) => {
        setDoctorId(id);
        setDate(undefined);
        setSlots([]);
        setTime("");
        setStep("datetime");
    };
    // Load slots on date change
    const handleDateSelect = useCallback(async (d) => {
        setDate(d);
        setTime("");
        if (!d || !doctorId || !category)
            return;
        setLoading(true);
        const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        const res = await get("/slots?doctorId=" + doctorId + "&date=" + dateStr + "&category=" + category);
        setLoading(false);
        if (res.success && res.data) {
            setSlots(res.data.slots);
        }
        else {
            setSlots([]);
        }
    }, [doctorId, category]);
    // Select time ? go to questions
    const handleTimeSelect = (t) => {
        setTime(t);
        setStep("questions");
    };
    // Handle answer change
    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => prev.map((a) => (a.questionId === questionId ? { ...a, answer: value } : a)));
    };
    // Submit booking (single or series)
    const handleSubmit = async () => {
        if (!date || !doctorId || !category || !time)
            return;
        const missing = questions.filter((q) => q.required && !answers.find((a) => a.questionId === q.id)?.answer);
        if (missing.length > 0) {
            setError("Bitte füellen Sie alle Pflichtfelder aus.");
            return;
        }
        setError("");
        setLoading(true);
        const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
        const filteredAnswers = answers.filter((a) => a.answer !== "");
        if (bookingMode === "series" && selectedSeriesId) {
            const res = await post("/appointments/series", {
                insuranceNumber,
                doctorId,
                startDate: dateStr,
                startTime: time,
                seriesId: selectedSeriesId,
                answers: filteredAnswers,
            });
            setLoading(false);
            if (res.success && res.data) {
                const template = seriesTemplates.find((t) => t.id === selectedSeriesId);
                setSuccess({ type: "series", data: { ...res.data, templateName: template?.name || "Impfserie" } });
                setStep("confirm");
                loadAppointments();
            }
            else {
                setError(res.error || "Buchung fehlgeschlagen");
            }
        }
        else {
            const res = await post("/appointments", {
                insuranceNumber,
                doctorId,
                date: dateStr,
                time,
                category,
                answers: filteredAnswers,
            });
            setLoading(false);
            if (res.success && res.data) {
                const doc = doctors.find((d) => d.id === doctorId);
                setSuccess({
                    type: "single",
                    data: {
                        date: dateStr,
                        time,
                        category: CATEGORIES.find((c) => c.value === category)?.label || category,
                        doctorName: doc ? doc.first_name + " " + doc.last_name : "",
                    },
                });
                setStep("confirm");
                loadAppointments();
            }
            else {
                setError(res.error || "Buchung fehlgeschlagen");
            }
        }
    };
    // Confirm a pending series dose
    const handleConfirmDose = async (appointmentId) => {
        setLoading(true);
        const res = await patch("/appointments/" + appointmentId + "/confirm-series", {});
        setLoading(false);
        if (res.success) {
            loadAppointments();
        }
        else {
            setError(res.error || "Bestätigung fehlgeschlagen");
        }
    };
    // Reset entire flow
    const handleNewBooking = () => {
        setStep("category");
        setCategory("");
        setBookingMode("single");
        setSelectedSeriesId(null);
        setDoctorId(null);
        setDate(undefined);
        setSlots([]);
        setTime("");
        setQuestions([]);
        setAnswers([]);
        setError("");
        setSuccess(null);
    };
    const handleBackToMenu = () => {
        setShowAppointments(false);
        setStep("overview");
        navigate("/patient");
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // -- Render: Confirm Success ------------------
    if (success && step === "confirm") {
        if (success.type === "series") {
            const s = success.data;
            return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Mein Bereich" }), _jsxs(Card, { className: "max-w-lg", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "flex items-center gap-2 text-green-600", children: "\u2705 Impfserie gebucht" }), _jsxs(CardDescription, { children: [s.templateName, " \u2013 ", s.appointments.length, " Dosen"] })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx("div", { className: "rounded-lg bg-muted p-4 space-y-2", children: s.appointments.map((apt, _i) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-muted-foreground", children: ["Dosis ", apt.series_dose_number] }), _jsxs("span", { className: "font-medium", children: [apt.date, " um ", apt.time, " Uhr", apt.status === "SCHEDULED" && "\u2705", apt.status === "PENDING_CONFIRMATION" && "\u2705"] })] }, apt.id))) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\uD83D\uDCA1 Folgetermine m\u00FCssen Sie sp\u00E4ter einzeln best\u00E4tigen." }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", className: "flex-1", onClick: handleBackToMenu, children: "\u00DCbersicht" }), _jsx(Button, { className: "flex-1", onClick: handleNewBooking, children: "Weiteren Termin buchen" })] })] })] })] }));
        }
        // Single booking success
        const s = success.data;
        return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Mein Bereich" }), _jsxs(Card, { className: "max-w-lg", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "flex items-center gap-2 text-green-600", children: "\u2705 Termin best\u00E4tigt" }), _jsx(CardDescription, { children: "Ihre Buchung wurde erfolgreich gespeichert." })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "rounded-lg bg-muted p-4 space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Terminart" }), _jsx("span", { className: "font-medium", children: s.category })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Arzt" }), _jsx("span", { className: "font-medium", children: s.doctorName })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Datum" }), _jsx("span", { className: "font-medium", children: s.date })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Uhrzeit" }), _jsxs("span", { className: "font-medium", children: [s.time, " Uhr"] })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", className: "flex-1", onClick: handleBackToMenu, children: "\u00DCbersicht" }), _jsx(Button, { className: "flex-1", onClick: handleNewBooking, children: "Weiteren Termin buchen" })] })] })] })] }));
    }
    // -- Render: My Appointments (series overview) --
    if (showAppointments) {
        const seriesGroups = {};
        const normalAppointments = myAppointments.filter((a) => !a.series_group_id);
        for (const a of myAppointments) {
            if (a.series_group_id) {
                if (!seriesGroups[a.series_group_id])
                    seriesGroups[a.series_group_id] = [];
                seriesGroups[a.series_group_id].push(a);
            }
        }
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Meine Termine" }), _jsx(Badge, { variant: "outline", className: "text-sm", children: patientName })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error })), myAppointments.filter((a) => a.status === "PENDING_CONFIRMATION").length > 0 && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: ["\u23F3 Best\u00E4tigung ausstehend", _jsx(Badge, { variant: "secondary", className: "ml-auto", children: myAppointments.filter((a) => a.status === "PENDING_CONFIRMATION").length })] }), _jsx(CardDescription, { children: "Folgetermine einer Impfserie, die Sie best\u00E4tigen m\u00FCssen" })] }), _jsx(CardContent, { className: "space-y-3", children: myAppointments.filter((a) => a.status === "PENDING_CONFIRMATION").map((apt) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "font-medium text-sm", children: ["Dosis ", apt.series_dose_number, " \u2013 ", apt.date, " um ", apt.time, " Uhr"] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["Dr. ", apt.doctor_last_name] })] }), _jsx(Button, { size: "sm", onClick: () => handleConfirmDose(apt.id), disabled: loading, children: loading ? "..." : "Bestätigen" })] }, apt.id))) })] })), Object.entries(seriesGroups).map(([groupId, aps]) => {
                    const seriesName = seriesTemplates.find((t) => t.id === aps[0]?.series_id)?.name || "Impfserie";
                    const sorted = [...aps].sort((a, b) => (a.series_dose_number || 0) - (b.series_dose_number || 0));
                    return (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: ["\uD83D\uDC89 ", seriesName] }), _jsxs(CardDescription, { children: [sorted.length, " Dosen"] })] }), _jsx(CardContent, { className: "space-y-2", children: sorted.map((apt) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border p-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "font-medium", children: ["Dosis ", apt.series_dose_number] }), _jsxs("span", { className: "text-muted-foreground", children: [apt.date, " um ", apt.time, " Uhr"] })] }), _jsx(Badge, { className: apt.status === "SCHEDULED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700", children: STATUS_MAP[apt.status] || apt.status })] }, apt.id))) })] }, groupId));
                }), normalAppointments.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Weitere Termine" }) }), _jsx(CardContent, { className: "space-y-2", children: normalAppointments.map((apt) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border p-2 text-sm", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { children: CATEGORY_LABEL[apt.category] || apt.category }), _jsxs("span", { className: "text-muted-foreground", children: [apt.date, " um ", apt.time, " Uhr"] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["Dr. ", apt.doctor_last_name] })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Badge, { variant: "outline", children: STATUS_MAP[apt.status] || apt.status }) })] }, apt.id))) })] })), _jsx(Button, { variant: "outline", onClick: handleBackToMenu, children: "Zur\u00FCck zur \u00DCbersicht" })] }));
    }
    // -- Render: Step indicator --------------------
    const stepIndex = ["login", "category", "seriesChoice", "seriesTemplate", "doctor", "datetime", "questions", "confirm", "overview"];
    const currentIdx = stepIndex.indexOf(step);
    const showSteps = step !== "login" && step !== "overview" && step !== "confirm";
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Patientenportal" }), patientName && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex rounded-lg border bg-muted p-0.5", children: [_jsx("button", { onClick: () => { setStep("overview"); setShowAppointments(false); navigate("/patient"); }, className: `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "/patient" || activeTab === "/patient/" ? "bg-white text-primary shadow-sm" : "hover:text-foreground"}`, children: "\u00DCbersicht" }), _jsx("button", { onClick: () => { setStep("category"); setShowAppointments(false); navigate("/patient/book"); }, className: `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${step !== "login" && step !== "overview" && !showAppointments ? "bg-white text-primary shadow-sm" : "hover:text-foreground"}`, children: "Buchen" }), _jsx("button", { onClick: async () => { await loadAppointments(); setShowAppointments(true); navigate("/patient/appointments"); }, className: `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showAppointments ? "bg-white text-primary shadow-sm" : "hover:text-foreground"}`, children: "Termine" }), _jsx("button", { onClick: () => navigate("/patient/prescriptions"), className: `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "/patient/prescriptions" ? "bg-white text-primary shadow-sm" : "hover:text-foreground"}`, children: "Rezepte" })] }), _jsx(Badge, { variant: "outline", className: "text-sm", children: patientName })] }))] }), showSteps && (_jsx("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: ["Terminart", "Arzt", "Datum", "Fragebogen"].map((label, i) => (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium " +
                                (i + 1 < currentIdx ? "bg-primary text-primary-foreground" :
                                    i + 1 === currentIdx ? "bg-primary/20 text-primary font-bold" :
                                        "bg-muted text-muted-foreground"), children: i + 1 }), _jsx("span", { className: i + 1 === currentIdx ? "font-medium text-foreground" : "", children: label }), i < 3 && _jsx("span", { className: "mx-1", children: "\u203A" })] }, label))) })), error && (_jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error })), step === "login" && (_jsxs(Card, { className: "max-w-md", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Patienten-Login" }), _jsx(CardDescription, { children: "Geben Sie Ihre Versichertennummer ein, um einen Termin zu buchen." })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "insurance", children: "Versichertennummer" }), _jsx(Input, { id: "insurance", value: insuranceNumber, onChange: (e) => setInsuranceNumber(e.target.value), placeholder: "z. B. A123456789", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "dob", children: "Geburtsdatum (optional)" }), _jsx(Input, { id: "dob", type: "date", value: dateOfBirth, onChange: (e) => setDateOfBirth(e.target.value) })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Wird geladen..." : "Weiter" })] }) })] })), step === "category" && (_jsx("div", { className: "grid gap-4 md:grid-cols-2", children: CATEGORIES.map((cat) => (_jsx(Card, { className: "cursor-pointer transition-all hover:border-primary hover:shadow-md", onClick: () => handleCategory(cat.value), children: _jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx("span", { children: cat.icon }), cat.label] }) }) }, cat.value))) })), step === "seriesChoice" && (_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Card, { className: "cursor-pointer transition-all hover:border-primary hover:shadow-md", onClick: () => handleSeriesChoice("single"), children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-lg", children: "\uD83D\uDC89 Einzeltermin" }), _jsx(CardDescription, { children: "Nur eine Impfung buchen" })] }) }), _jsx(Card, { className: "cursor-pointer transition-all hover:border-primary hover:shadow-md", onClick: () => handleSeriesChoice("series"), children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-lg", children: "\uD83D\uDCC5 Impfserie" }), _jsx(CardDescription, { children: "Mehrere Dosen im Voraus planen (FSME, Hepatitis B, \u2026)" })] }) })] })), step === "seriesTemplate" && (_jsx("div", { className: "grid gap-4 md:grid-cols-2", children: seriesTemplates.filter((t) => t.doses > 1).map((tpl) => (_jsx(Card, { className: "cursor-pointer transition-all hover:border-primary hover:shadow-md", onClick: () => handleSeriesTemplate(tpl.id), children: _jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-base", children: tpl.name }), _jsxs(CardDescription, { children: [tpl.doses, " Dosen \u2013 ", tpl.description?.split("–")[1] || tpl.description] })] }) }, tpl.id))) })), step === "doctor" && (_jsx("div", { className: "grid gap-4 md:grid-cols-3", children: doctors.map((doc) => (_jsx(Card, { className: "cursor-pointer transition-all hover:shadow-md " + (doctorId === doc.id ? "ring-2 ring-primary" : "hover:border-primary"), onClick: () => handleDoctor(doc.id), children: _jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx("span", { className: "inline-block size-3 rounded-full", style: { backgroundColor: doc.color || "#888" } }), "Dr. ", doc.last_name] }), _jsxs(CardDescription, { children: [doc.first_name, " ", doc.last_name] })] }) }, doc.id))) })), step === "datetime" && (_jsxs("div", { className: "grid gap-6 md:grid-cols-[auto_1fr]", children: [_jsxs("div", { children: [_jsx(Label, { className: "mb-2 block", children: "Datum ausw\u00E4hlen" }), _jsx(Calendar, { mode: "single", selected: date, onSelect: handleDateSelect, disabled: (d) => d < today })] }), _jsxs("div", { children: [_jsxs(Label, { className: "mb-2 block", children: ["Verf\u00FCgbare Zeiten", loading && _jsx("span", { className: "ml-2 text-xs text-muted-foreground", children: "(lade...)" })] }), !date && _jsx("p", { className: "text-sm text-muted-foreground", children: "Bitte w\u00E4hlen Sie zuerst ein Datum." }), date && slots.length === 0 && !loading && _jsx("p", { className: "text-sm text-muted-foreground", children: "Keine freien Slots an diesem Tag." }), date && slots.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: slots.map((t) => (_jsx(Button, { variant: time === t ? "default" : "outline", size: "sm", onClick: () => handleTimeSelect(t), children: t }, t))) }))] })] })), step === "questions" && (_jsxs(Card, { className: "max-w-lg", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Fragebogen" }), _jsx(CardDescription, { children: "Bitte beantworten Sie die folgenden Fragen f\u00FCr Ihren Termin." })] }), _jsxs(CardContent, { className: "space-y-4", children: [questions.length === 0 && _jsx("p", { className: "text-sm text-muted-foreground", children: "F\u00FCr diese Terminart sind keine Fragen hinterlegt." }), questions.map((q) => {
                                const answer = answers.find((a) => a.questionId === q.id);
                                return (_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { children: [q.question_text, q.required ? _jsx("span", { className: "text-destructive ml-1", children: "*" }) : null] }), q.answer_type === "boolean" ? (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", size: "sm", variant: answer?.answer === "true" ? "default" : "outline", onClick: () => handleAnswerChange(q.id, "true"), children: "Ja" }), _jsx(Button, { type: "button", size: "sm", variant: answer?.answer === "false" ? "default" : "outline", onClick: () => handleAnswerChange(q.id, "false"), children: "Nein" })] })) : (_jsx(Input, { value: answer?.answer || "", onChange: (e) => handleAnswerChange(q.id, e.target.value), placeholder: "Ihre Antwort..." }))] }, q.id));
                            }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx(Button, { variant: "outline", onClick: () => setStep("datetime"), children: "Zur\u00FCck" }), _jsx(Button, { className: "flex-1", onClick: handleSubmit, disabled: loading, children: loading ? "Wird gebucht..." : "Termin verbindlich buchen" })] })] })] }))] }));
}
