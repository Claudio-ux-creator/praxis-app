import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { get, post, patch } from "@/lib/api";
// -- Hilfsfunktionen ---------------------------
function categoryBadgeClass(cat) {
    const map = {
        CHECKUP: "bg-blue-100 text-blue-800",
        CONSULTATION: "bg-purple-100 text-purple-800",
        VACCINATION: "bg-green-100 text-green-800",
        PRESCRIPTION_PICKUP: "bg-amber-100 text-amber-800",
        ACUTE: "bg-red-100 text-red-800",
        BLOOD_DRAW: "bg-slate-100 text-slate-800",
        INITIAL: "bg-orange-100 text-orange-800",
    };
    return map[cat] || "bg-gray-100 text-gray-800";
}
function categoryLabel(cat) {
    const map = {
        CHECKUP: "Vorsorge",
        CONSULTATION: "Beratung",
        VACCINATION: "Impfung",
        PRESCRIPTION_PICKUP: "Rezept-Abholung",
        ACUTE: "Akut",
        BLOOD_DRAW: "Blutabnahme",
        INITIAL: "Erstgespräch",
    };
    return map[cat] || cat;
}
function statusBadgeClass(status) {
    const map = {
        SCHEDULED: "bg-slate-100 text-slate-700 border-slate-300",
        PENDING_CONFIRMATION: "bg-amber-100 text-amber-700 border-amber-300",
        CHECKED_IN: "bg-blue-100 text-blue-700 border-blue-300",
        IN_PROGRESS: "bg-yellow-100 text-yellow-700 border-yellow-300",
        COMPLETED: "bg-green-100 text-green-700 border-green-300",
        CANCELLED: "bg-red-100 text-red-700 border-red-300",
        NO_SHOW: "bg-gray-200 text-gray-700 border-gray-400",
    };
    return map[status] || "bg-slate-100 text-slate-700";
}
function statusLabel(status) {
    const map = {
        SCHEDULED: "Geplant",
        PENDING_CONFIRMATION: "Ausstehend",
        CHECKED_IN: "Eingecheckt",
        IN_PROGRESS: "In Behandlung",
        COMPLETED: "Abgeschlossen",
        CANCELLED: "Storniert",
        NO_SHOW: "Nicht erschienen",
    };
    return map[status] || status;
}
function rxStatusBadge(status) {
    const map = {
        PENDING: { class: "bg-red-100 text-red-800 border-red-300", label: "🔴 Neu" },
        IN_PROGRESS: { class: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "🟡 In Prüfung" },
        APPROVED: { class: "bg-green-100 text-green-800 border-green-300", label: "🟢 Freigegeben" },
        REJECTED: { class: "bg-gray-200 text-gray-700 border-gray-400", label: "⚪ Abgelehnt" },
        COLLECTED: { class: "bg-blue-100 text-blue-800 border-blue-300", label: "🔵 Abgeholt" },
    };
    return map[status] || { class: "bg-gray-100 text-gray-700", label: status };
}
const NEXT_STATUS_MAP = {
    PENDING_CONFIRMATION: ["SCHEDULED"],
    SCHEDULED: ["CHECKED_IN", "CANCELLED"],
    CHECKED_IN: ["IN_PROGRESS", "NO_SHOW", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};
const RX_NEXT_STATUS = {
    PENDING: ["IN_PROGRESS"],
    IN_PROGRESS: ["APPROVED", "REJECTED"],
    APPROVED: ["COLLECTED"],
    REJECTED: [],
    COLLECTED: [],
};
export default function MFADashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Dialog states
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
    const [fixPatient, setFixPatient] = useState("");
    const [fixMedication, setFixMedication] = useState("");
    // -- Daten laden ------------------------------
    const loadDashboard = useCallback(async () => {
        setLoading(true);
        const res = await get("/mfa/dashboard");
        setLoading(false);
        if (res.success && res.data) {
            setDashboard(res.data);
        }
        else {
            setError(res.error || "Dashboard-Daten konnten nicht geladen werden");
        }
    }, []);
    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);
    // -- Status-Änderung Termin --------------------
    const handleStatusChange = async (appointmentId, newStatus) => {
        await patch("/appointments/" + appointmentId + "/status", { status: newStatus });
        loadDashboard();
    };
    // -- Notiz speichern ---------------------------
    const handleSaveNote = async () => {
        if (!selectedAppointment)
            return;
        await patch("/appointments/" + selectedAppointment.id + "/note", { note: newNote });
        setShowAppointmentDialog(false);
        setSelectedAppointment(null);
        loadDashboard();
    };
    // -- Rezept-Status ändern ----------------------
    const handleRxStatusChange = async (id, newStatus) => {
        await patch("/prescriptions/" + id + "/status", { status: newStatus });
        loadDashboard();
    };
    // -- Neues Rezept anlegen ----------------------
    const handleCreatePrescription = async () => {
        if (!fixPatient || !fixMedication)
            return;
        await post("/prescriptions", {
            insuranceNumber: fixPatient,
            medicationName: fixMedication,
            initiatedByMfaId: 1,
            responsibleDoctorId: 1,
        });
        setShowPrescriptionDialog(false);
        setFixPatient("");
        setFixMedication("");
        loadDashboard();
    };
    const today = dashboard?.date || new Date().toISOString().slice(0, 10);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "MFA-Dashboard" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Badge, { variant: "outline", className: "text-sm", children: ["Heute, ", today] }), _jsx(Button, { size: "sm", variant: "outline", onClick: loadDashboard, disabled: loading, children: loading ? "..." : "🔄 Aktualisieren" })] })] }), error && (_jsx("div", { className: "rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsxs(Card, { className: "md:col-span-1", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx("span", { className: "inline-flex size-2 rounded-full bg-blue-500" }), "Heutige Termine", dashboard && (_jsx(Badge, { variant: "secondary", className: "ml-auto text-xs", children: dashboard.todaysAppointments.length }))] }), _jsxs(CardDescription, { children: [dashboard?.todaysAppointments.length || 0, " Termin", dashboard?.todaysAppointments.length !== 1 ? "e" : "", " heute"] })] }), _jsxs(CardContent, { className: "space-y-3 max-h-[70vh] overflow-y-auto", children: [dashboard && dashboard.todaysAppointments.filter(a => a.status === "PENDING_CONFIRMATION").length > 0 && (_jsx("div", { className: "mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3", children: _jsxs("p", { className: "text-sm font-medium text-amber-800 flex items-center gap-2", children: [_jsx("span", { className: "inline-flex size-2 rounded-full bg-amber-500" }), dashboard.todaysAppointments.filter(a => a.status === "PENDING_CONFIRMATION").length, " Termin(e) warten auf Best\u00E4tigung"] }) })), !dashboard || dashboard.todaysAppointments.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-4 text-center", children: "Keine Termine f\u00FCr heute." })) : (dashboard.todaysAppointments.map((apt) => (_jsxs("div", { className: "rounded-lg border p-3 space-y-2 text-sm hover:border-blue-200 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsxs("div", { className: "font-medium", children: [apt.patient_last_name, ", ", apt.patient_first_name] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [apt.insurance_number, " \u00B7 ", apt.phone] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "font-semibold text-base", children: apt.time }), _jsx(Badge, { className: categoryBadgeClass(apt.category) + " text-xs mt-1", children: categoryLabel(apt.category) })] })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx("span", { className: "inline-block size-2 rounded-full", style: { backgroundColor: apt.doctor_color || "#888" } }), "Dr. ", apt.doctor_last_name, _jsx("span", { className: "ml-auto", children: apt.booking_type === "PHONE" ? "📞 Tel." : "🌐 Online" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-1", children: [_jsx(Badge, { className: statusBadgeClass(apt.status) + " text-xs", children: statusLabel(apt.status) }), _jsxs("div", { className: "ml-auto flex gap-1", children: [NEXT_STATUS_MAP[apt.status]?.map((ns) => (_jsx(Button, { size: "xs", variant: "outline", onClick: () => handleStatusChange(apt.id, ns), children: statusLabel(ns) }, ns))), _jsx(Button, { size: "xs", variant: "ghost", onClick: () => {
                                                                    setSelectedAppointment(apt);
                                                                    setNewNote(apt.mfa_note || "");
                                                                    setShowAppointmentDialog(true);
                                                                }, title: "Notiz", children: "\uD83D\uDCDD" })] })] }), apt.mfa_note && (_jsx("div", { className: "text-xs text-muted-foreground italic bg-muted p-2 rounded", children: apt.mfa_note })), apt.no_show_count >= 2 && (_jsxs("div", { className: "text-xs text-destructive font-medium", children: ["\u26A0\uFE0F No-Shows: ", apt.no_show_count] }))] }, apt.id))))] })] }), _jsxs(Card, { className: "md:col-span-1", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx("span", { className: "inline-flex size-2 rounded-full bg-amber-500" }), "Offene Rezeptanfragen", dashboard && dashboard.pendingPrescriptions.length > 0 && (_jsx(Badge, { variant: "secondary", className: "ml-auto text-xs", children: dashboard.pendingPrescriptions.length }))] }), _jsx(CardDescription, { children: "Ampel-Workflow: \uD83D\uDD34 Neu \u2192 \uD83D\uDFE1 Pr\u00FCfung \u2192 \uD83D\uDFE2 Fertig" })] }), _jsxs(CardContent, { className: "space-y-3 max-h-[70vh] overflow-y-auto", children: [_jsx(Button, { size: "sm", className: "w-full", variant: "outline", onClick: () => setShowPrescriptionDialog(true), children: "+ Neues Rezept anlegen" }), !dashboard || dashboard.pendingPrescriptions.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-4 text-center", children: "Keine offenen Rezeptanfragen." })) : (dashboard.pendingPrescriptions.map((rx) => {
                                        const sb = rxStatusBadge(rx.status);
                                        return (_jsxs("div", { className: "rounded-lg border p-3 space-y-2 text-sm hover:border-amber-200 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: rx.medication_name }), rx.dosage && (_jsx("div", { className: "text-xs text-muted-foreground", children: rx.dosage }))] }), _jsx(Badge, { className: sb.class + " text-xs", children: sb.label })] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: [rx.patient_last_name, ", ", rx.patient_first_name, " (", rx.insurance_number, ")"] }), _jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1", children: ["\uD83D\uDC68\u200D\u2695\uFE0F Dr. ", rx.doctor_last_name, _jsxs("span", { className: "ml-auto", children: ["\uD83D\uDCC5 ", rx.request_date] })] }), rx.notes && (_jsx("div", { className: "text-xs italic bg-muted p-2 rounded", children: rx.notes })), _jsx("div", { className: "flex gap-1 pt-1", children: RX_NEXT_STATUS[rx.status]?.map((ns) => (_jsx(Button, { size: "xs", variant: ns === "APPROVED" ? "default" :
                                                            ns === "REJECTED" ? "destructive" : "outline", className: "text-xs", onClick: () => handleRxStatusChange(rx.id, ns), children: ns === "IN_PROGRESS" ? "🔍 Prüfen" :
                                                            ns === "APPROVED" ? "✅ Freigeben" :
                                                                ns === "REJECTED" ? "❌ Ablehnen" :
                                                                    ns === "COLLECTED" ? "📦 Abgeholt" : ns }, ns))) })] }, rx.id));
                                    }))] })] }), _jsxs(Card, { className: "md:col-span-1", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx("span", { className: "inline-flex size-2 rounded-full bg-red-500" }), "Akutslots", _jsx(Badge, { variant: "secondary", className: "ml-auto text-xs", children: "Heute" })] }), _jsx(CardDescription, { children: "Verbleibende Akutslots pro Arzt" })] }), _jsx(CardContent, { className: "space-y-4", children: !dashboard || dashboard.acuteSlotInfo.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-4 text-center", children: "Keine Daten verf\u00FCgbar." })) : (dashboard.acuteSlotInfo.map((slot) => {
                                    const pct = slot.totalSlots > 0
                                        ? Math.round((slot.usedSlots / slot.totalSlots) * 100)
                                        : 0;
                                    const barColor = pct >= 100
                                        ? "bg-red-500"
                                        : pct >= 75
                                            ? "bg-amber-500"
                                            : "bg-green-500";
                                    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-block size-2.5 rounded-full", style: { backgroundColor: slot.doctorColor || "#888" } }), _jsx("span", { className: "font-medium", children: slot.doctorName })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "font-semibold text-lg", children: slot.remainingSlots }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [" / ", slot.totalSlots] })] })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-muted overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all " + barColor, style: { width: Math.min(pct, 100) + "%" } }) }), _jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [_jsxs("span", { children: [slot.usedSlots, " belegt"] }), _jsxs("span", { children: [slot.remainingSlots, " frei"] })] })] }, slot.doctorId));
                                })) })] })] }), showAppointmentDialog && selectedAppointment && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30", children: _jsxs(Card, { className: "w-full max-w-sm", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-base", children: "Notiz zu Termin" }), _jsxs(CardDescription, { children: [selectedAppointment.patient_last_name, ", ", selectedAppointment.patient_first_name, " \u2013 ", selectedAppointment.time, " Uhr"] })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx(Label, { children: "MFA-Notiz" }), _jsx(Input, { value: newNote, onChange: (e) => setNewNote(e.target.value), placeholder: "Notiz eingeben..." }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "outline", onClick: () => setShowAppointmentDialog(false), children: "Abbrechen" }), _jsx(Button, { onClick: handleSaveNote, children: "Speichern" })] })] })] }) })), showPrescriptionDialog && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/30", children: _jsxs(Card, { className: "w-full max-w-sm", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-base", children: "Neues Rezept anlegen" }), _jsx(CardDescription, { children: "Rezeptanfrage f\u00FCr einen Patienten erfassen" })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Versichertennummer" }), _jsx(Input, { value: fixPatient, onChange: (e) => setFixPatient(e.target.value), placeholder: "z. B. A123456789" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { children: "Medikament" }), _jsx(Input, { value: fixMedication, onChange: (e) => setFixMedication(e.target.value), placeholder: "z. B. Ibuprofen 400mg" })] }), _jsxs("div", { className: "flex gap-2 justify-end pt-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowPrescriptionDialog(false), children: "Abbrechen" }), _jsx(Button, { onClick: handleCreatePrescription, disabled: !fixPatient || !fixMedication, children: "Anlegen" })] })] })] }) }))] }));
}
