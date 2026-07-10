import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { get, post, patch } from "@/lib/api";
// -- Typen -------------------------------------
interface TodayAppointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  category: string;
  date: string;
  time: string;
  status: string;
  booking_type: string;
  mfa_note: string | null;
  insurance_number: string;
  patient_first_name: string;
  patient_last_name: string;
  date_of_birth: string;
  phone: string;
  no_show_count: number;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_color: string | null;
}

interface PendingPrescription {
  id: number;
  patient_id: number;
  medication_name: string;
  dosage: string | null;
  notes: string | null;
  status: string;
  request_date: string;
  approved_date: string | null;
  patient_first_name: string;
  patient_last_name: string;
  insurance_number: string;
  phone: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

interface AcuteSlotInfo {
  doctorId: number;
  doctorName: string;
  doctorColor: string | null;
  totalSlots: number;
  usedSlots: number;
  remainingSlots: number;
}

interface DashboardData {
  date: string;
  todaysAppointments: TodayAppointment[];
  pendingPrescriptions: PendingPrescription[];
  acuteSlotInfo: AcuteSlotInfo[];
}

// -- Hilfsfunktionen ---------------------------
function categoryBadgeClass(cat: string): string {
  const map: Record<string, string> = {
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

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
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

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "bg-slate-100 text-slate-700 border-slate-300",
    CHECKED_IN: "bg-blue-100 text-blue-700 border-blue-300",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 border-yellow-300",
    COMPLETED: "bg-green-100 text-green-700 border-green-300",
    CANCELLED: "bg-red-100 text-red-700 border-red-300",
    NO_SHOW: "bg-gray-200 text-gray-700 border-gray-400",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Geplant",
    CHECKED_IN: "Eingecheckt",
    IN_PROGRESS: "In Behandlung",
    COMPLETED: "Abgeschlossen",
    CANCELLED: "Storniert",
    NO_SHOW: "Nicht erschienen",
  };
  return map[status] || status;
}

function rxStatusBadge(status: string): { class: string; label: string } {
  const map: Record<string, { class: string; label: string }> = {
    PENDING: { class: "bg-red-100 text-red-800 border-red-300", label: "🔴 Neu" },
    IN_PROGRESS: { class: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "🟡 In Prüfung" },
    APPROVED: { class: "bg-green-100 text-green-800 border-green-300", label: "🟢 Freigegeben" },
    REJECTED: { class: "bg-gray-200 text-gray-700 border-gray-400", label: "⚪ Abgelehnt" },
    COLLECTED: { class: "bg-blue-100 text-blue-800 border-blue-300", label: "🔵 Abgeholt" },
  };
  return map[status] || { class: "bg-gray-100 text-gray-700", label: status };
}

const NEXT_STATUS_MAP: Record<string, string[]> = {
  SCHEDULED: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["IN_PROGRESS", "NO_SHOW", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const RX_NEXT_STATUS: Record<string, string[]> = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["APPROVED", "REJECTED"],
  APPROVED: ["COLLECTED"],
  REJECTED: [],
  COLLECTED: [],
};

export default function MFADashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog states
  const [selectedAppointment, setSelectedAppointment] = useState<TodayAppointment | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [newNote, setNewNote] = useState("");

  
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [fixPatient, setFixPatient] = useState("");
  const [fixMedication, setFixMedication] = useState("");

  // -- Daten laden ------------------------------
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const res = await get<DashboardData>("/mfa/dashboard");
    setLoading(false);
    if (res.success && res.data) {
      setDashboard(res.data);
    } else {
      setError(res.error || "Dashboard-Daten konnten nicht geladen werden");
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // -- Status-Änderung Termin --------------------
  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    await patch("/appointments/" + appointmentId + "/status", { status: newStatus });
    loadDashboard();
  };

  // -- Notiz speichern ---------------------------
  const handleSaveNote = async () => {
    if (!selectedAppointment) return;
    await patch("/appointments/" + selectedAppointment.id + "/note", { note: newNote });
    setShowAppointmentDialog(false);
    setSelectedAppointment(null);
    loadDashboard();
  };

  // -- Rezept-Status ändern ----------------------
  const handleRxStatusChange = async (id: number, newStatus: string) => {
    await patch("/prescriptions/" + id + "/status", { status: newStatus });
    loadDashboard();
  };

  // -- Neues Rezept anlegen ----------------------
  const handleCreatePrescription = async () => {
    if (!fixPatient || !fixMedication) return;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MFA-Dashboard</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">Heute, {today}</Badge>
          <Button size="sm" variant="outline" onClick={loadDashboard} disabled={loading}>
            {loading ? "..." : "🔄 Aktualisieren"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 3-Spalten-Layout */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* SPALTE 1: Heutige Termine */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-blue-500" />
              Heutige Termine
              {dashboard && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {dashboard.todaysAppointments.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {dashboard?.todaysAppointments.length || 0} Termin{dashboard?.todaysAppointments.length !== 1 ? "e" : ""} heute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
            {!dashboard || dashboard.todaysAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Keine Termine für heute.
              </p>
            ) : (
              dashboard.todaysAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="rounded-lg border p-3 space-y-2 text-sm hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">
                        {apt.patient_last_name}, {apt.patient_first_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {apt.insurance_number} · {apt.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-base">{apt.time}</div>
                      <Badge className={categoryBadgeClass(apt.category) + " text-xs mt-1"}>
                        {categoryLabel(apt.category)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: apt.doctor_color || "#888" }}
                    />
                    Dr. {apt.doctor_last_name}
                    <span className="ml-auto">
                      {apt.booking_type === "PHONE" ? "📞 Tel." : "🌐 Online"}
                    </span>
                  </div>

                  {/* Status-Badge + Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Badge className={statusBadgeClass(apt.status) + " text-xs"}>
                      {statusLabel(apt.status)}
                    </Badge>
                    <div className="ml-auto flex gap-1">
                      {NEXT_STATUS_MAP[apt.status]?.map((ns) => (
                        <Button
                          key={ns}
                          size="xs"
                          variant="outline"
                          onClick={() => handleStatusChange(apt.id, ns)}
                        >
                          {statusLabel(ns)}
                        </Button>
                      ))}
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setNewNote(apt.mfa_note || "");
                          setShowAppointmentDialog(true);
                        }}
                        title="Notiz"
                      >
📝
                      </Button>
                    </div>
                  </div>

                  {apt.mfa_note && (
                    <div className="text-xs text-muted-foreground italic bg-muted p-2 rounded">
                      {apt.mfa_note}
                    </div>
                  )}

                  {apt.no_show_count >= 2 && (
                    <div className="text-xs text-destructive font-medium">
                      ⚠️ No-Shows: {apt.no_show_count}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* SPALTE 2: Offene Rezeptanfragen */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-amber-500" />
              Offene Rezeptanfragen
              {dashboard && dashboard.pendingPrescriptions.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {dashboard.pendingPrescriptions.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Ampel-Workflow: 🔴 Neu → 🟡 Prüfung → 🟢 Fertig
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto">
            <Button
              size="sm"
              className="w-full"
              variant="outline"
              onClick={() => setShowPrescriptionDialog(true)}
            >
              + Neues Rezept anlegen
            </Button>

            {!dashboard || dashboard.pendingPrescriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Keine offenen Rezeptanfragen.
              </p>
            ) : (
              dashboard.pendingPrescriptions.map((rx) => {
                const sb = rxStatusBadge(rx.status);
                return (
                  <div
                    key={rx.id}
                    className="rounded-lg border p-3 space-y-2 text-sm hover:border-amber-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{rx.medication_name}</div>
                        {rx.dosage && (
                          <div className="text-xs text-muted-foreground">{rx.dosage}</div>
                        )}
                      </div>
                      <Badge className={sb.class + " text-xs"}>{sb.label}</Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {rx.patient_last_name}, {rx.patient_first_name} ({rx.insurance_number})
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      👨‍⚕️ Dr. {rx.doctor_last_name}
                      <span className="ml-auto">?? {rx.request_date}</span>
                    </div>

                    {rx.notes && (
                      <div className="text-xs italic bg-muted p-2 rounded">{rx.notes}</div>
                    )}

                    <div className="flex gap-1 pt-1">
                      {RX_NEXT_STATUS[rx.status]?.map((ns) => (
                        <Button
                          key={ns}
                          size="xs"
                          variant={
                            ns === "APPROVED" ? "default" :
                            ns === "REJECTED" ? "destructive" : "outline"
                          }
                          className="text-xs"
                          onClick={() => handleRxStatusChange(rx.id, ns)}
                        >
                          {ns === "IN_PROGRESS" ? "?? Prüfen" :
                           ns === "APPROVED" ? "?? Freigeben" :
                           ns === "REJECTED" ? "? Ablehnen" :
                           ns === "COLLECTED" ? "?? Abgeholt" : ns}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* SPALTE 3: Akutslots */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-red-500" />
              Akutslots
              <Badge variant="secondary" className="ml-auto text-xs">
                Heute
              </Badge>
            </CardTitle>
            <CardDescription>
              Verbleibende Akutslots pro Arzt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!dashboard || dashboard.acuteSlotInfo.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Keine Daten verfügbar.
              </p>
            ) : (
              dashboard.acuteSlotInfo.map((slot) => {
                const pct = slot.totalSlots > 0
                  ? Math.round((slot.usedSlots / slot.totalSlots) * 100)
                  : 0;
                const barColor = pct >= 100
                  ? "bg-red-500"
                  : pct >= 75
                    ? "bg-amber-500"
                    : "bg-green-500";
                return (
                  <div key={slot.doctorId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ backgroundColor: slot.doctorColor || "#888" }}
                        />
                        <span className="font-medium">{slot.doctorName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-lg">{slot.remainingSlots}</span>
                        <span className="text-xs text-muted-foreground"> / {slot.totalSlots}</span>
                      </div>
                    </div>

                    {/* Fortschrittsbalken */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={"h-full rounded-full transition-all " + barColor}
                        style={{ width: Math.min(pct, 100) + "%" }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{slot.usedSlots} belegt</span>
                      <span>{slot.remainingSlots} frei</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notiz-Dialog */}
      {showAppointmentDialog && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">Notiz zu Termin</CardTitle>
              <CardDescription>
                {selectedAppointment.patient_last_name}, {selectedAppointment.patient_first_name} – {selectedAppointment.time} Uhr
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label>MFA-Notiz</Label>
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Notiz eingeben..."
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleSaveNote}>
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Neues Rezept-Dialog */}
      {showPrescriptionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">Neues Rezept anlegen</CardTitle>
              <CardDescription>
                Rezeptanfrage für einen Patienten erfassen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Versichertennummer</Label>
                <Input
                  value={fixPatient}
                  onChange={(e) => setFixPatient(e.target.value)}
                  placeholder="z. B. A123456789"
                />
              </div>
              <div className="space-y-1">
                <Label>Medikament</Label>
                <Input
                  value={fixMedication}
                  onChange={(e) => setFixMedication(e.target.value)}
                  placeholder="z. B. Ibuprofen 400mg"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreatePrescription} disabled={!fixPatient || !fixMedication}>
                  Anlegen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
