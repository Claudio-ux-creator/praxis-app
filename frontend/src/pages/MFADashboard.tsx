import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { get, post, patch } from "@/lib/api";
interface TodayAppointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  category: string;
  date: string;
  time: string;
  status: string;
  insurance_number: string;
  patient_first_name: string;
  patient_last_name: string;
  phone: string;
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
function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    CHECKUP: "Vorsorge", CONSULTATION: "Beratung", VACCINATION: "Impfung",
    PRESCRIPTION_PICKUP: "Rezept-Abholung", ACUTE: "Akut"
  };
  return map[cat] || cat;
}
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Geplant", PENDING_CONFIRMATION: "Ausstehend", CHECKED_IN: "Eingecheckt",
    IN_PROGRESS: "In Behandlung", COMPLETED: "Abgeschlossen", CANCELLED: "Storniert", NO_SHOW: "Nicht erschienen"
  };
  return map[status] || status;
}
function rxStatusBadge(status: string): { class: string; label: string } {
  const map: Record<string, { class: string; label: string }> = {
    PENDING: { class: "bg-red-100 text-red-800 border-red-300", label: "[Neu]" },
    mfa_approved: { class: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "[MFA geprüfung]" },
    mfa_rejected: { class: "bg-gray-200 text-gray-700 border-gray-400", label: "[MFA abgelehnt]" },
    auto_rejected: { class: "bg-gray-200 text-gray-700 border-gray-400", label: "[Auto-Ablehnung]" },
    doctor_approved: { class: "bg-green-100 text-green-800 border-green-300", label: "[Freigegeben]" },
    doctor_rejected: { class: "bg-gray-200 text-gray-700 border-gray-400", label: "[Arzt abgelehnt]" },
    collected: { class: "bg-blue-100 text-blue-800 border-blue-300", label: "[Abgeholt]" }
  };
  return map[status] || { class: "bg-gray-100 text-gray-700", label: status };
}
const NEXT_STATUS_MAP: Record<string, string[]> = {
  PENDING_CONFIRMATION: ["SCHEDULED"], SCHEDULED: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["IN_PROGRESS", "NO_SHOW", "CANCELLED"], IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
  COMPLETED: [], CANCELLED: [], NO_SHOW: []
};
function fmtClosureDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return d + "." + m + ".";
}

export default function MFADashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [fixPatient, setFixPatient] = useState("");
  const [fixMedication, setFixMedication] = useState("");
  const [fixLastName, setFixLastName] = useState("");
  const [fixFirstName, setFixFirstName] = useState("");
  const [fixDob, setFixDob] = useState("");
  const [fixDosage, setFixDosage] = useState("");
  const [fixNotes, setFixNotes] = useState("");
  const [patientCandidates, setPatientCandidates] = useState<any[]>([]);
  const [upcomingClosure, setUpcomingClosure] = useState<{ start_date: string; end_date: string; reason: string | null } | null>(null);
  interface AcuteSlotsData{date:string;slots:any[];}const [acuteSlots, setAcuteSlots] = useState<AcuteSlotsData|null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState<boolean>(false);
  const [bookingSlotId, setBookingSlotId] = useState<number|null>(null);
  const [bookingPatientName, setBookingPatientName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const loadData = () => {
    setLoading(true);
    get<DashboardData>("/mfa/dashboard").then((r) => {
      if (r.success && r.data) setDashboard(r.data);
      setLoading(false);
    });
  };
  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    get<{ start_date: string; end_date: string; reason: string | null } | null>("/practice-closures/upcoming").then((r) => {
      if (r.success) setUpcomingClosure(r.data || null);
    });
  }, []);

  // Autovervollständigung im Rezept-Dialog: bei Versichertennummer oder komplettem Namen suchen
  useEffect(() => {
    if (!showPrescriptionDialog) { setPatientCandidates([]); return; }

    const byInsurance = fixPatient.trim().length >= 4;
    const byFullName = fixLastName.trim().length >= 2 && fixFirstName.trim().length >= 2;
    const byLastNameOnly = !byFullName && fixLastName.trim().length >= 2;
    if (!byInsurance && !byFullName && !byLastNameOnly) { setPatientCandidates([]); return; }

    const timer = setTimeout(async () => {
      const query = byInsurance
        ? "/patients/search?insuranceNumber=" + encodeURIComponent(fixPatient.trim())
        : byFullName
        ? "/patients/search?lastName=" + encodeURIComponent(fixLastName.trim()) + "&firstName=" + encodeURIComponent(fixFirstName.trim())
        : "/patients/search?lastName=" + encodeURIComponent(fixLastName.trim());
      const res = await get<any[]>(query);
      if (!res.success || !res.data) { setPatientCandidates([]); return; }
      if (res.data.length === 1) {
        const p = res.data[0];
        setFixPatient(p.insurance_number);
        setFixLastName(p.last_name);
        setFixFirstName(p.first_name);
        setFixDob(p.date_of_birth);
        setPatientCandidates([]);
      } else {
        setPatientCandidates(res.data);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [fixPatient, fixLastName, fixFirstName, showPrescriptionDialog]);

  const selectPatientCandidate = (p: any) => {
    setFixPatient(p.insurance_number);
    setFixLastName(p.last_name);
    setFixFirstName(p.first_name);
    setFixDob(p.date_of_birth);
    setPatientCandidates([]);
  };

  useEffect(() => {
    if (!loading) {
      const today = new Date().toISOString().slice(0, 10);
      get("/acute-slots?date=" + today).then((r: any) => {
        if (r.success && r.data) setAcuteSlots(r.data);
      });
    }
  }, [loading]);


  const openBooking = (slotId: number) => {
    setBookingSlotId(slotId);
    setBookingPatientName("");
    setBookingPhone("");
    setBookingNotes("");
    setShowBookingDialog(true);
  };

  const handleBookSlot = async () => {
    if (!bookingSlotId || !bookingPatientName) { alert("Patientenname erforderlich"); return; }
    const r = await post("/acute-slots/" + bookingSlotId + "/book", {
      patientName: bookingPatientName, phone: bookingPhone, bookedByMfaId: 1, notes: bookingNotes
    });
    if (!r.success) { alert(r.error || "Fehler"); return; }
    setShowBookingDialog(false);
    const today = new Date().toISOString().slice(0, 10);
    get("/acute-slots?date=" + today).then((res: any) => {
      if (res.success && res.data) setAcuteSlots(res.data);
    });
  };

  const handleCancelBooking = async (slotId: number) => {
    if (!confirm("Buchung wirklich stornieren?")) return;
    const r = await post("/acute-slots/" + slotId + "/cancel", {});
    if (!r.success) { alert(r.error || "Fehler"); return; }
    const today = new Date().toISOString().slice(0, 10);
    get("/acute-slots?date=" + today).then((res: any) => {
      if (res.success && res.data) setAcuteSlots(res.data);
    });
  };
  const changeStatus = async (appointmentId: number, newStatus: string) => {
    await patch("/appointments/" + appointmentId + "/status", { status: newStatus });
    loadData();
  };
  const handlePrescriptionAction = async (rx: PendingPrescription, action: string) => {
    if (action === "forward") {
      const r = await post("/prescriptions/" + rx.id + "/mfa-approve", { mfaUserId: 1 });
      if (!r.success) { alert(r.error || "Fehler"); return; }
    } else if (action === "reject") {
      const reason = prompt("Grund für die Ablehnung:") || "";
      const r = await post("/prescriptions/" + rx.id + "/mfa-reject", { mfaUserId: 1, reason });
      if (!r.success) { alert(r.error || "Fehler"); return; }
    } else if (action === "collected") {
      const r = await post("/prescriptions/" + rx.id + "/collect", {});
      if (!r.success) { alert(r.error || "Fehler"); return; }
    }
    loadData();
  };
  const handleCreatePrescription = async () => {
    const lookup = await post("/patients/lookup", { insuranceNumber: fixPatient, dateOfBirth: fixDob });
    if (!lookup.success || !lookup.data) { alert(lookup.error || "Patient nicht gefunden"); return; }
    if (lookup.data.last_name !== fixLastName || lookup.data.first_name !== fixFirstName) {
      alert("Name stimmt nicht mit dem Patienten aus der Versichertennummer überein."); return;
    }
    const r = await post("/prescriptions/mfa-create", {
      patientId: lookup.data.id, medicationName: fixMedication, dosage: fixDosage || undefined, notes: fixNotes || undefined, initiatedByMfaId: 1
    });
    if (r.success) {
      setShowPrescriptionDialog(false);
      setFixPatient(""); setFixLastName(""); setFixFirstName(""); setFixDob(""); setFixMedication(""); setFixDosage(""); setFixNotes("");
      loadData();
    } else { alert(r.error || "Fehler"); }
  };
  if (loading) {
    return <div className="space-y-6"><h1 className="text-2xl font-semibold">MFA-Dashboard</h1><p className="text-muted-foreground">Lade...</p></div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">MFA-Dashboard</h1>
        <p className="text-sm text-muted-foreground">{dashboard?.date || ""}</p>
      </div>

      {upcomingClosure && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ Praxisschließung: {fmtClosureDate(upcomingClosure.start_date)} – {fmtClosureDate(upcomingClosure.end_date)}{upcomingClosure.end_date.slice(0, 4)}
          {upcomingClosure.reason && ` (${upcomingClosure.reason})`}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        {/* SPALTE 1: Heutige Termine */}
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-base">Heutige Termine</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(!dashboard || dashboard.todaysAppointments.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">Keine Termine heute.</p>
            )}
            {dashboard?.todaysAppointments.map((apt) => (
              <div key={apt.id} className="rounded-lg border p-3 text-sm space-y-1">
                <div className="font-medium">{apt.time} - {apt.patient_last_name}, {apt.patient_first_name}</div>
                <div className="text-xs text-muted-foreground">{categoryLabel(apt.category)} - Dr. {apt.doctor_last_name}</div>
                <div className="flex gap-1 pt-1 flex-wrap">
                  {NEXT_STATUS_MAP[apt.status]?.map((ns) => (
                    <Button key={ns} size="xs" variant="outline" onClick={() => changeStatus(apt.id, ns)} className="text-xs">
                      {ns === "CHECKED_IN" ? "Check-In" : ns === "CANCELLED" ? "Stornieren" : ns === "IN_PROGRESS" ? "In Behandlung" : ns === "COMPLETED" ? "Abschließen" : ns === "NO_SHOW" ? "No-Show" : ns === "SCHEDULED" ? "Planen" : ns}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* SPALTE 2: Offene Rezepte */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Offene Rezepte</CardTitle>
            <CardDescription>
              <Button size="xs" variant="outline" onClick={() => setShowPrescriptionDialog(true)} className="text-xs">
                + Neues Rezept anlegen
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(!dashboard || !dashboard.pendingPrescriptions || dashboard.pendingPrescriptions.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">Keine offenen Rezepte.</p>
            )}
            {dashboard?.pendingPrescriptions.map((rx) => (
              <div key={rx.id} className="rounded-lg border p-3 text-sm space-y-1">
                <div className="font-medium">{rx.medication_name}</div>
                <div className="text-xs text-muted-foreground">{rx.patient_last_name}, {rx.patient_first_name} ({rx.insurance_number})</div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className={"text-xs " + rxStatusBadge(rx.status).class}>
                    {rxStatusBadge(rx.status).label}
                  </Badge>
                  {rx.status === "PENDING" && (
                    <div className="flex gap-1">
                      <Button size="xs" variant="default" onClick={() => handlePrescriptionAction(rx, "forward")} className="text-xs">An Arzt weiterleiten</Button>
                      <Button size="xs" variant="destructive" onClick={() => handlePrescriptionAction(rx, "reject")} className="text-xs">Ablehnen</Button>
                    </div>
                  )}
                  {rx.status === "doctor_approved" && (
                    <Button size="xs" variant="default" onClick={() => handlePrescriptionAction(rx, "collected")} className="text-xs">Abgeholt</Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* SPALTE 3: Akutslots mit Buchungsfunktion */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Akutslots</CardTitle>
            <CardDescription>

            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!acuteSlots || !(acuteSlots as any).slots || (acuteSlots as any).slots.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Keine Akutslots für heute. Bitten Sie einen Arzt, eine Akutsprechstunde einzutragen.
              </p>
            )}
            {acuteSlots?.slots.length > 0 && (
              <div className="space-y-3">
                {Array.from(new Map(acuteSlots.slots.map((s) => [s.doctor_id, s])).values()).map((doc) => ({ id: doc.doctor_id, first_name: doc.doctor_first_name, last_name: doc.doctor_last_name })).map((doc) => {
                  const docSlots = acuteSlots.slots.filter((s) => s.doctor_id === doc.id);
                  if (docSlots.length === 0) return null;
                  const available = docSlots.filter((s) => s.is_available).length;
                  const total = docSlots.length;
                  const pct = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
                  const barColor = available === 0 ? "bg-red-500" : available <= Math.ceil(total * 0.25) ? "bg-amber-500" : "bg-green-500";
                  return (
                    <div key={doc.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{doc.first_name} {doc.last_name}</span>
                        <span className="font-semibold text-lg">{available}<span className="text-xs text-muted-foreground"> / {total}</span></span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-1">
                        <div className={"h-full rounded-full transition-all " + barColor} style={{ width: Math.min(pct, 100) + "%" }} />
                      </div>
                      <div className="mt-2 space-y-1">
                        {docSlots.map((slot) => (
                          <div key={slot.id} className={"flex items-center justify-between rounded px-2 py-1 text-xs " + (slot.is_available ? "bg-green-50 border border-green-200" : "bg-gray-100 border border-gray-200")}>
                            <span className="font-medium">{slot.time}</span>
                            {slot.is_available ? (
                              <Button size="xs" variant="ghost" className="text-xs h-6" onClick={() => openBooking(slot.id)}>Buchen</Button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground truncate max-w-[80px]">{slot.patient_name}</span>
                                <Button size="xs" variant="ghost" className="text-xs h-6 text-destructive" onClick={() => handleCancelBooking(slot.id)}>Stornieren</Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Neues Rezept-Dialog */}
      {/* Akutslot buchen Dialog */}
      {showBookingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999]">
            <h3 className="text-base font-semibold mb-4">Akutslot buchen</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Patientenname *</Label>
                <Input value={bookingPatientName} onChange={(e) => setBookingPatientName(e.target.value)} placeholder="z. B. Max Mustermann" />
              </div>
              <div className="space-y-1">
                <Label>Telefon</Label>
                <Input value={bookingPhone} onChange={(e) => setBookingPhone(e.target.value)} placeholder="z. B. +49 176 12345678" />
              </div>
              <div className="space-y-1">
                <Label>Notizen</Label>
                <Input value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)} placeholder="Optional" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowBookingDialog(false)}>Abbrechen</Button>
                <Button onClick={handleBookSlot} disabled={!bookingPatientName}>Buchen</Button>
              </div>
            </div>
          </div>
        </div>
      )}
{showPrescriptionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Card className="w-full max-w-lg bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999]">
            <CardHeader><CardTitle className="text-base">Neues Rezept anlegen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Versichertennummer *</Label>
                <Input value={fixPatient} onChange={(e) => setFixPatient(e.target.value)} placeholder="z. B. A123456789" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nachname *</Label>
                  <Input value={fixLastName} onChange={(e) => setFixLastName(e.target.value)} placeholder="z. B. Mustermann" />
                </div>
                <div className="space-y-1">
                  <Label>Vorname *</Label>
                  <Input value={fixFirstName} onChange={(e) => setFixFirstName(e.target.value)} placeholder="z. B. Max" />
                </div>
              </div>
              {patientCandidates.length > 1 && (
                <div className="rounded-lg border bg-amber-50 border-amber-200 p-2 space-y-1">
                  <p className="text-xs font-medium text-amber-800 px-1">Mehrere Patienten gefunden – bitte auswählen:</p>
                  {patientCandidates.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPatientCandidate(p)}
                      className="w-full text-left text-sm rounded-md px-2 py-1.5 hover:bg-white flex items-center justify-between"
                    >
                      <span className="font-medium">{p.last_name}, {p.first_name}</span>
                      <span className="text-xs text-muted-foreground">{p.insurance_number} · {p.date_of_birth}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-1">
                <Label>Geburtsdatum *</Label>
                <Input type="date" value={fixDob} onChange={(e) => setFixDob(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Medikament *</Label>
                <Input value={fixMedication} onChange={(e) => setFixMedication(e.target.value)} placeholder="z. B. Ibuprofen 400mg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Dosierung</Label>
                  <Input value={fixDosage} onChange={(e) => setFixDosage(e.target.value)} placeholder="Optional" />
                </div>
                <div className="space-y-1">
                  <Label>Notiz</Label>
                  <Input value={fixNotes} onChange={(e) => setFixNotes(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>Abbrechen</Button>
                <Button onClick={handleCreatePrescription} disabled={!fixPatient || !fixLastName || !fixFirstName || !fixDob || !fixMedication}>Anlegen</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


