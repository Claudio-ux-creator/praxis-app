﻿﻿﻿import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, ChevronLeft, ChevronRight, Pill, User, Phone, AlertCircle, ClipboardList, CalendarDays } from "lucide-react";
import { get } from "@/lib/api";

interface AppointmentItem {
  id: number;
  source_type: "APPOINTMENT" | "ACUTE_SLOT" | "PRESCRIPTION";
  category: string;
  date: string;
  time: string | null;
  status: string;
  booking_type: string;
  notes: string | null;
  series_id: number | null;
  series_dose_number: number | null;
  series_group_id: string | null;
  series_name: string | null;
  patient_id: number | null;
  patient_first_name: string;
  patient_last_name: string;
  insurance_number: string;
  date_of_birth: string;
  phone: string;
  reject_reason: string | null;
  medication_name: string | null;
  answers: { question_text: string; answer: string }[];
}

interface DoctorInfo {
  id: number;
  first_name: string;
  last_name: string;
}

// const WEEKDAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  SCHEDULED: { label: "Bestätigt", class: "bg-green-100 text-green-800 border-green-300" },
  PENDING_CONFIRMATION: { label: "Ausstehend", class: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  CHECKED_IN: { label: "Eingecheckt", class: "bg-blue-100 text-blue-800 border-blue-300" },
  IN_PROGRESS: { label: "In Behandlung", class: "bg-purple-100 text-purple-800 border-purple-300" },
  COMPLETED: { label: "Abgeschlossen", class: "bg-gray-100 text-gray-700 border-gray-300" },
  CANCELLED: { label: "Storniert", class: "bg-red-100 text-red-800 border-red-300" },
  NO_SHOW: { label: "Nicht erschienen", class: "bg-orange-100 text-orange-800 border-orange-300" },
  BOOKED: { label: "Gebucht (MFA)", class: "bg-teal-100 text-teal-800 border-teal-300" },
  AVAILABLE: { label: "Verfügbar", class: "bg-green-50 text-green-600 border-green-200" },
  PENDING: { label: "Rezept-Anfrage", class: "bg-red-100 text-red-800 border-red-300" },
  mfa_approved: { label: "MFA geprüft", class: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  mfa_rejected: { label: "MFA abgelehnt", class: "bg-gray-200 text-gray-700 border-gray-400" },
  auto_rejected: { label: "Auto-Ablehnung", class: "bg-gray-200 text-gray-700 border-gray-400" },
  doctor_approved: { label: "Freigegeben", class: "bg-green-100 text-green-800 border-green-300" },
  doctor_rejected: { label: "Arzt abgelehnt", class: "bg-gray-200 text-gray-700 border-gray-400" },
  collected: { label: "Abgeholt", class: "bg-blue-100 text-blue-800 border-blue-300" },
};

const CATEGORY_MAP: Record<string, { label: string; icon: any }> = {
  CHECKUP: { label: "Vorsorge", icon: ClipboardList },
  CONSULTATION: { label: "Beratung", icon: User },
  VACCINATION: { label: "Impfung", icon: Calendar },
  PRESCRIPTION_PICKUP: { label: "Rezept-Abholung", icon: Pill },
  ACUTE: { label: "Akut", icon: Clock },
};

function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Heute";
  if (dateStr === tomorrow) return "Morgen";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function categoryLabel(cat: string): string {
  return CATEGORY_MAP[cat]?.label || cat;
}

function categoryIcon(cat: string): any {
  return CATEGORY_MAP[cat]?.icon || Calendar;
}

function statusBadge(status: string): { label: string; class: string } {
  return STATUS_MAP[status] || { label: status, class: "bg-gray-100 text-gray-700" };
}

export default function DoctorAppointmentsOverview() {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  useEffect(() => {
    const stored = localStorage.getItem("doctor_info");
    if (stored) setDoctorInfo(JSON.parse(stored));
  }, []);

  const loadAppointments = () => {
    if (!doctorInfo) return;
    setLoading(true);
    get<AppointmentItem[]>(
      "/doctor/appointments?doctorId=" + doctorInfo.id + "&from=" + fromDate + "&to=" + toDate
    ).then((r) => {
      if (r.success && r.data) setAppointments(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadAppointments(); }, [doctorInfo]);

  const shiftDays = (days: number) => {
    const from = new Date(fromDate + "T12:00:00");
    from.setDate(from.getDate() + days);
    const to = new Date(toDate + "T12:00:00");
    to.setDate(to.getDate() + days);
    setFromDate(from.toISOString().slice(0, 10));
    setToDate(to.toISOString().slice(0, 10));
  };

  useEffect(() => {
    if (fromDate && toDate) loadAppointments();
  }, [fromDate, toDate]);

  // Gruppieren nach Datum
  const grouped: Record<string, AppointmentItem[]> = {};
  for (const a of appointments) {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  }

  const sortedDates = Object.keys(grouped).sort();

  if (!doctorInfo) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Terminübersicht</h1>
          <p className="text-muted-foreground">Alle Termine auf einen Blick</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shiftDays(-7)}>
            <ChevronLeft className="h-4 w-4" /> Vorwoche
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setFromDate(new Date().toISOString().slice(0, 10));
            setToDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
          }}>
            <Calendar className="h-4 w-4" /> Heute
          </Button>
          <Button variant="outline" size="sm" onClick={() => shiftDays(7)}>
            Nächste Woche <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label>Von</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1">
          <Label>Bis</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-44" />
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Lade Termine...</p>}

      {!loading && sortedDates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-lg font-medium mt-4">Keine Termine im gewählten Zeitraum</p>
            <p className="text-sm text-muted-foreground">Alle Termine werden hier angezeigt, sobald sie gebucht wurden.</p>
          </CardContent>
        </Card>
      )}

      {sortedDates.map((date) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
            <h2 className="text-lg font-semibold">{formatDateLabel(date)}</h2>
            <Badge variant="outline" className="text-xs">
              {grouped[date].length} Termin{(grouped[date].length !== 1) ? "e" : ""}
            </Badge>
          </div>

          {grouped[date].map((appt) => {
            const Icon = categoryIcon(appt.category);
            const st = statusBadge(appt.status);
            const isPrescription = appt.source_type === "PRESCRIPTION";
            const isAcute = appt.source_type === "ACUTE_SLOT";

            return (
              <Card key={appt.source_type + "-" + appt.id} className={"transition-all border-l-4 " + (
                appt.status === "CANCELLED" || appt.status?.startsWith("rejected")
                  ? "border-l-red-400 opacity-70"
                  : appt.status === "COMPLETED" || appt.status === "collected"
                    ? "border-l-green-400 opacity-80"
                    : appt.source_type === "PRESCRIPTION"
                      ? "border-l-amber-400"
                      : appt.source_type === "ACUTE_SLOT"
                        ? "border-l-teal-400"
                        : "border-l-primary"
              )}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="mt-0.5">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {isAcute
                              ? appt.patient_first_name
                              : appt.patient_last_name + ", " + appt.patient_first_name}
                          </span>
                          {appt.insurance_number && (
                            <span className="text-xs text-muted-foreground">{appt.insurance_number}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                          <span>{categoryLabel(appt.category)}</span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span>{appt.time || "—"}</span>
                          {appt.series_name && (
                            <>
                              <span>·</span>
                              <Calendar className="h-3 w-3" />
                              <span>{appt.series_name} ({appt.series_dose_number}. Dosis)</span>
                            </>
                          )}
                        </div>
                        {isPrescription && appt.medication_name && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Medikament:</span> {appt.medication_name}
                          </p>
                        )}
                        {appt.answers && appt.answers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {appt.answers.map((a, i) => (
                              <p key={i} className="text-xs text-muted-foreground">
                                <span className="font-medium">{a.question_text}:</span> {a.answer}
                              </p>
                            ))}
                          </div>
                        )}
                        {appt.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Notiz: {appt.notes}
                          </p>
                        )}
                        {appt.reject_reason && (
                          <div className="mt-2 flex items-start gap-1 text-xs text-red-600 bg-red-50 rounded p-2">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>Ablehnungsgrund: {appt.reject_reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge className={st.class + " border text-xs"}>
                        {st.label}
                      </Badge>
                      {appt.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {appt.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
