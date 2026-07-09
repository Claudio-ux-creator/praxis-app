import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { get, post, patch } from "@/lib/api";

// -- Typen -------------------------------------
interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  color: string | null;
  acute_slots_per_day: number;
}

interface Question {
  id: number;
  category: string;
  question_text: string;
  sort_order: number;
  answer_type: "text" | "boolean" | "date";
  required: number;
}

interface Answer {
  questionId: number;
  questionText: string;
  answer: string;
}

interface VaccinationTemplate {
  id: number;
  name: string;
  description: string;
  doses: number;
  intervals_days: string;
}

interface AppointmentResult {
  id: number;
  date: string;
  time: string;
  status: string;
  category: string;
  series_id: number | null;
  series_dose_number: number | null;
  series_group_id: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
}

type Step = "login" | "category" | "seriesChoice" | "seriesTemplate" | "doctor" | "datetime" | "questions" | "confirm" | "overview";

const CATEGORIES = [
  { value: "CHECKUP", label: "Vorsorge", icon: "??" },
  { value: "CONSULTATION", label: "Beratung", icon: "??" },
  { value: "VACCINATION", label: "Impfung", icon: "??" },
  { value: "PRESCRIPTION_PICKUP", label: "Rezept-Abholung", icon: "??" },
];

const STATUS_MAP: Record<string, string> = {
  SCHEDULED: "Geplant",
  PENDING_CONFIRMATION: "Bestätigung ausstehend",
  CHECKED_IN: "Eingecheckt",
  IN_PROGRESS: "In Behandlung",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
  NO_SHOW: "Nicht erschienen",
};

const CATEGORY_LABEL: Record<string, string> = {
  CHECKUP: "Vorsorge",
  CONSULTATION: "Beratung",
  VACCINATION: "Impfung",
  PRESCRIPTION_PICKUP: "Rezept-Abholung",
  ACUTE: "Akut",
};

export default function PatientPortal() {
  // Login
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [patientName, setPatientName] = useState("");

  // Booking state
  const [step, setStep] = useState<Step>("login");
  const [category, setCategory] = useState("");
  const [bookingMode, setBookingMode] = useState<"single" | "series">("single");
  const [seriesTemplates, setSeriesTemplates] = useState<VaccinationTemplate[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    type: "single" | "series";
    data: any;
  } | null>(null);

  // My appointments
  const [myAppointments, setMyAppointments] = useState<AppointmentResult[]>([]);
  const [showAppointments, setShowAppointments] = useState(false);

  // Load doctors once
  useEffect(() => {
    get<Doctor[]>("/doctors").then((res) => {
      if (res.success && res.data) setDoctors(res.data);
    });
    get<VaccinationTemplate[]>("/vaccination-series").then((res) => {
      if (res.success && res.data) setSeriesTemplates(res.data);
    });
  }, []);

  // Load questions when category changes
  useEffect(() => {
    if (!category) return;
    get<Question[]>("/questions?category=" + category).then((res) => {
      if (res.success && res.data) {
        setQuestions(res.data);
        setAnswers(res.data.map((q) => ({
          questionId: q.id,
          questionText: q.question_text,
          answer: "",
        })));
      } else {
        setQuestions([]);
        setAnswers([]);
      }
    });
  }, [category]);

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!insuranceNumber) return;
    const res = await get<AppointmentResult[]>("/appointments?insuranceNumber=" + insuranceNumber);
    if (res.success && res.data) {
      setMyAppointments(res.data);
    }
  }, [insuranceNumber]);

  // Patient-Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await post<{ id: number; first_name: string; last_name: string }>("/patients/lookup", {
      insuranceNumber,
      dateOfBirth: dateOfBirth || undefined,
    });
    setLoading(false);
    if (res.success && res.data) {
      setPatientName(res.data.first_name + " " + res.data.last_name);
      setStep("category");
      loadAppointments();
    } else {
      setError(res.error || "Patient nicht gefunden");
    }
  };

  // Select category
  const handleCategory = (val: string) => {
    setCategory(val);
    setBookingMode("single");
    setSelectedSeriesId(null);
    setDoctorId(null);
    setDate(undefined);
    setSlots([]);
    setTime("");
    if (val === "VACCINATION") {
      setStep("seriesChoice");
    } else {
      setStep("doctor");
    }
  };

  // Select booking mode for vaccination
  const handleSeriesChoice = (mode: "single" | "series") => {
    setBookingMode(mode);
    if (mode === "series") {
      setStep("seriesTemplate");
    } else {
      setStep("doctor");
    }
  };

  // Select series template
  const handleSeriesTemplate = (id: number) => {
    setSelectedSeriesId(id);
    setStep("doctor");
  };

  // Select doctor
  const handleDoctor = (id: number) => {
    setDoctorId(id);
    setDate(undefined);
    setSlots([]);
    setTime("");
    setStep("datetime");
  };

  // Load slots on date change
  const handleDateSelect = useCallback(async (d: Date | undefined) => {
    setDate(d);
    setTime("");
    if (!d || !doctorId || !category) return;
    setLoading(true);
    const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const res = await get<{ slots: string[] }>("/slots?doctorId=" + doctorId + "&date=" + dateStr + "&category=" + category);
    setLoading(false);
    if (res.success && res.data) {
      setSlots(res.data.slots);
    } else {
      setSlots([]);
    }
  }, [doctorId, category]);

  // Select time ? go to questions
  const handleTimeSelect = (t: string) => {
    setTime(t);
    setStep("questions");
  };

  // Handle answer change
  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, answer: value } : a))
    );
  };

  // Submit booking (single or series)
  const handleSubmit = async () => {
    if (!date || !doctorId || !category || !time) return;

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
      const res = await post<{ seriesGroupId: string; appointments: any[] }>("/appointments/series", {
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
      } else {
        setError(res.error || "Buchung fehlgeschlagen");
      }
    } else {
      const res = await post<{ appointment: any }>("/appointments", {
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
      } else {
        setError(res.error || "Buchung fehlgeschlagen");
      }
    }
  };

  // Confirm a pending series dose
  const handleConfirmDose = async (appointmentId: number) => {
    setLoading(true);
    const res = await patch("/appointments/" + appointmentId + "/confirm-series", {});
    setLoading(false);
    if (res.success) {
      loadAppointments();
    } else {
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
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // -- Render: Confirm Success ------------------
  if (success && step === "confirm") {
    if (success.type === "series") {
      const s = success.data;
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Mein Bereich</h1>
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                ? Impfserie gebucht
              </CardTitle>
              <CardDescription>
                {s.templateName} – {s.appointments.length} Dosen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                {s.appointments.map((apt: any, _i: number) => (
                  <div key={apt.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dosis {apt.series_dose_number}</span>
                    <span className="font-medium">
                      {apt.date} um {apt.time} Uhr
                      {apt.status === "SCHEDULED" && "\u2705"}
                      {apt.status === "PENDING_CONFIRMATION" && "\u2705"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                ? Folgetermine müssen Sie später einzeln bestätigen.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleBackToMenu}>
                  Übersicht
                </Button>
                <Button className="flex-1" onClick={handleNewBooking}>
                  Weiteren Termin buchen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Single booking success
    const s = success.data;
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Mein Bereich</h1>
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">? Termin bestätigt</CardTitle>
            <CardDescription>Ihre Buchung wurde erfolgreich gespeichert.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Terminart</span>
                <span className="font-medium">{s.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arzt</span>
                <span className="font-medium">{s.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Datum</span>
                <span className="font-medium">{s.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uhrzeit</span>
                <span className="font-medium">{s.time} Uhr</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleBackToMenu}>
                Übersicht
              </Button>
              <Button className="flex-1" onClick={handleNewBooking}>
                Weiteren Termin buchen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -- Render: My Appointments (series overview) --
  if (showAppointments) {
    const seriesGroups: Record<string, AppointmentResult[]> = {};
    const normalAppointments = myAppointments.filter((a) => !a.series_group_id);
    for (const a of myAppointments) {
      if (a.series_group_id) {
        if (!seriesGroups[a.series_group_id]) seriesGroups[a.series_group_id] = [];
        seriesGroups[a.series_group_id].push(a);
      }
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Meine Termine</h1>
          <Badge variant="outline" className="text-sm">{patientName}</Badge>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* Pending confirmations */}
        {myAppointments.filter((a) => a.status === "PENDING_CONFIRMATION").length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                ? Bestätigung ausstehend
                <Badge variant="secondary" className="ml-auto">
                  {myAppointments.filter((a) => a.status === "PENDING_CONFIRMATION").length}
                </Badge>
              </CardTitle>
              <CardDescription>Folgetermine einer Impfserie, die Sie bestätigen müssen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myAppointments.filter((a) => a.status === "PENDING_CONFIRMATION").map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium text-sm">Dosis {apt.series_dose_number} – {apt.date} um {apt.time} Uhr</div>
                    <div className="text-xs text-muted-foreground">Dr. {apt.doctor_last_name}</div>
                  </div>
                  <Button size="sm" onClick={() => handleConfirmDose(apt.id)} disabled={loading}>
                    {loading ? "..." : "Bestätigen"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Series groups */}
        {Object.entries(seriesGroups).map(([groupId, aps]) => {
          const seriesName = seriesTemplates.find((t) => t.id === aps[0]?.series_id)?.name || "Impfserie";
          const sorted = [...aps].sort((a, b) => (a.series_dose_number || 0) - (b.series_dose_number || 0));
          return (
            <Card key={groupId}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  ?? {seriesName}
                </CardTitle>
                <CardDescription>{sorted.length} Dosen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sorted.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Dosis {apt.series_dose_number}</span>
                      <span className="text-muted-foreground">{apt.date} um {apt.time} Uhr</span>
                    </div>
                    <Badge className={apt.status === "SCHEDULED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                      {STATUS_MAP[apt.status] || apt.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* Normal appointments */}
        {normalAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weitere Termine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {normalAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span>{CATEGORY_LABEL[apt.category] || apt.category}</span>
                    <span className="text-muted-foreground">{apt.date} um {apt.time} Uhr</span>
                    <span className="text-xs text-muted-foreground">Dr. {apt.doctor_last_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{STATUS_MAP[apt.status] || apt.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={handleBackToMenu}>Zurück zur Übersicht</Button>
      </div>
    );
  }

  // -- Render: Step indicator --------------------
  const stepIndex = ["login", "category", "seriesChoice", "seriesTemplate", "doctor", "datetime", "questions", "confirm", "overview"];
  const currentIdx = stepIndex.indexOf(step);
  const showSteps = step !== "login" && step !== "overview" && step !== "confirm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {step === "login" ? "Mein Bereich" : "Termin buchen"}
        </h1>
        {patientName && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={async () => { await loadAppointments(); setShowAppointments(true); }}>
              Meine Termine
            </Button>
            <Badge variant="outline" className="text-sm">{patientName}</Badge>
          </div>
        )}
      </div>

      {showSteps && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {["Terminart", "Arzt", "Datum", "Fragebogen"].map((label, i) => (
            <span key={label} className="flex items-center gap-1">
              <span className={
                "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium " +
                (i + 1 < currentIdx ? "bg-primary text-primary-foreground" :
                 i + 1 === currentIdx ? "bg-primary/20 text-primary font-bold" :
                 "bg-muted text-muted-foreground")
              }>
                {i + 1}
              </span>
              <span className={i + 1 === currentIdx ? "font-medium text-foreground" : ""}>{label}</span>
              {i < 3 && <span className="mx-1">?</span>}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Step: Login */}
      {step === "login" && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Patienten-Login</CardTitle>
            <CardDescription>Geben Sie Ihre Versichertennummer ein, um einen Termin zu buchen.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="insurance">Versichertennummer</Label>
                <Input id="insurance" value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value)} placeholder="z. B. A123456789" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Geburtsdatum (optional)</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Wird geladen..." : "Weiter"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step: Category */}
      {step === "category" && (
        <div className="grid gap-4 md:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <Card key={cat.value} className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => handleCategory(cat.value)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><span>{cat.icon}</span>{cat.label}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Step: Series choice (for vaccination) */}
      {step === "seriesChoice" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => handleSeriesChoice("single")}>
            <CardHeader>
              <CardTitle className="text-lg">?? Einzeltermin</CardTitle>
              <CardDescription>Nur eine Impfung buchen</CardDescription>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => handleSeriesChoice("series")}>
            <CardHeader>
              <CardTitle className="text-lg">?? Impfserie</CardTitle>
              <CardDescription>Mehrere Dosen im Voraus planen (FSME, Hepatitis B, …)</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Step: Series template selection */}
      {step === "seriesTemplate" && (
        <div className="grid gap-4 md:grid-cols-2">
          {seriesTemplates.filter((t) => t.doses > 1).map((tpl) => (
            <Card key={tpl.id} className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => handleSeriesTemplate(tpl.id)}>
              <CardHeader>
                <CardTitle className="text-base">{tpl.name}</CardTitle>
                <CardDescription>{tpl.doses} Dosen – {tpl.description?.split("–")[1] || tpl.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Step: Doctor */}
      {step === "doctor" && (
        <div className="grid gap-4 md:grid-cols-3">
          {doctors.map((doc) => (
            <Card key={doc.id} className={"cursor-pointer transition-all hover:shadow-md " + (doctorId === doc.id ? "ring-2 ring-primary" : "hover:border-primary")} onClick={() => handleDoctor(doc.id)}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="inline-block size-3 rounded-full" style={{ backgroundColor: doc.color || "#888" }} />
                  Dr. {doc.last_name}
                </CardTitle>
                <CardDescription>{doc.first_name} {doc.last_name}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Step: Date & Time */}
      {step === "datetime" && (
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div>
            <Label className="mb-2 block">Datum auswählen</Label>
            <Calendar mode="single" selected={date} onSelect={handleDateSelect} disabled={(d: Date) => d < today} />
          </div>
          <div>
            <Label className="mb-2 block">
              Verfügbare Zeiten{loading && <span className="ml-2 text-xs text-muted-foreground">(lade...)</span>}
            </Label>
            {!date && <p className="text-sm text-muted-foreground">Bitte wählen Sie zuerst ein Datum.</p>}
            {date && slots.length === 0 && !loading && <p className="text-sm text-muted-foreground">Keine freien Slots an diesem Tag.</p>}
            {date && slots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {slots.map((t) => (
                  <Button key={t} variant={time === t ? "default" : "outline"} size="sm" onClick={() => handleTimeSelect(t)}>{t}</Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Questions */}
      {step === "questions" && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Fragebogen</CardTitle>
            <CardDescription>Bitte beantworten Sie die folgenden Fragen für Ihren Termin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.length === 0 && <p className="text-sm text-muted-foreground">Für diese Terminart sind keine Fragen hinterlegt.</p>}
            {questions.map((q) => {
              const answer = answers.find((a) => a.questionId === q.id);
              return (
                <div key={q.id} className="space-y-2">
                  <Label>{q.question_text}{q.required ? <span className="text-destructive ml-1">*</span> : null}</Label>
                  {q.answer_type === "boolean" ? (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={answer?.answer === "true" ? "default" : "outline"} onClick={() => handleAnswerChange(q.id, "true")}>Ja</Button>
                      <Button type="button" size="sm" variant={answer?.answer === "false" ? "default" : "outline"} onClick={() => handleAnswerChange(q.id, "false")}>Nein</Button>
                    </div>
                  ) : (
                    <Input value={answer?.answer || ""} onChange={(e) => handleAnswerChange(q.id, e.target.value)} placeholder="Ihre Antwort..." />
                  )}
                </div>
              );
            })}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("datetime")}>Zurück</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? "Wird gebucht..." : "Termin verbindlich buchen"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
