import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Stethoscope, FileText, CalendarClock } from 'lucide-react';
import { get, patch } from '@/lib/api';

interface Appointment {
  id: number;
  patient_first_name: string;
  patient_last_name: string;
  insurance_number: string;
  phone: string;
  date: string;
  time: string;
  status: string;
  category: string;
  booking_type: string;
  doctor_id: number;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_color: string | null;
}

const STATUS_MAP: Record<string, string> = {
  SCHEDULED: 'Geplant',
  PENDING_CONFIRMATION: 'Ausstehend',
  CHECKED_IN: 'Eingecheckt',
  IN_PROGRESS: 'In Behandlung',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Storniert',
  NO_SHOW: 'Nicht erschienen',
};

const CATEGORY_LABEL: Record<string, string> = {
  CHECKUP: 'Vorsorge',
  CONSULTATION: 'Beratung',
  VACCINATION: 'Impfung',
  PRESCRIPTION_PICKUP: 'Rezept-Abholung',
  ACUTE: 'Akut',
  BLOOD_DRAW: 'Blutabnahme',
  INITIAL: 'Erstgespräch',
};

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED: 'default',
  PENDING_CONFIRMATION: 'secondary',
  CHECKED_IN: 'default',
  IN_PROGRESS: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
  NO_SHOW: 'destructive',
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function fmtDayMonth(d: Date): string {
  return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.';
}

// ISO-8601-Kalenderwoche: Montag als Wochenstart, Woche 1 enthaelt den ersten Donnerstag des Jahres
function getISOWeekInfo(dateStr: string): { week: number; weekStart: Date; weekEnd: Date } {
  const date = new Date(dateStr + 'T00:00:00');
  const dow = date.getDay() || 7; // 1=Mo .. 7=So
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dow + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const thursday = new Date(weekStart);
  thursday.setDate(weekStart.getDate() + 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return { week, weekStart, weekEnd };
}

function weekGroupKey(dateStr: string): string {
  const { week, weekStart } = getISOWeekInfo(dateStr);
  return weekStart.getFullYear() + '-W' + pad2(week);
}

function weekGroupLabel(dateStr: string): string {
  const { week, weekStart, weekEnd } = getISOWeekInfo(dateStr);
  return 'KW ' + week + ' – ' + fmtDayMonth(weekStart) + ' – ' + fmtDayMonth(weekEnd) + weekEnd.getFullYear();
}

export default function MFAAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [moveTarget, setMoveTarget] = useState<Appointment | null>(null);
  const [moveDate, setMoveDate] = useState('');
  const [moveTime, setMoveTime] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState('');
  const [moveSlots, setMoveSlots] = useState<string[]>([]);
  const [moveSlotsLoading, setMoveSlotsLoading] = useState(false);
  const [moveSlotsError, setMoveSlotsError] = useState('');

  const loadAppointments = () => {
    setLoading(true);
    get<Appointment[]>('/mfa/appointments').then((r) => {
      if (r.success && r.data) setAppointments(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Verfügbare Slots laden, sobald im Verschieben-Modal ein Datum ausgewählt ist
  useEffect(() => {
    if (!moveTarget || !moveDate) { setMoveSlots([]); setMoveSlotsError(''); return; }
    setMoveSlotsLoading(true);
    setMoveSlotsError('');
    get<{ slots: string[] }>(
      '/slots?doctorId=' + moveTarget.doctor_id + '&date=' + moveDate + '&category=' + moveTarget.category
    ).then((r) => {
      setMoveSlotsLoading(false);
      if (r.success && r.data) {
        let slots = r.data.slots;
        // Der aktuell gebuchte Slot ist an seinem eigenen Termin belegt und wird daher
        // vom Backend ausgeschlossen - für dasselbe Datum trotzdem als Option anbieten.
        if (moveDate === moveTarget.date && !slots.includes(moveTarget.time)) {
          slots = [...slots, moveTarget.time].sort();
        }
        setMoveSlots(slots);
      } else {
        setMoveSlots([]);
        setMoveSlotsError(r.error || 'Slots konnten nicht geladen werden');
      }
    });
  }, [moveTarget, moveDate]);

  const handleConfirm = async (id: number) => {
    await patch("/appointments/" + id + "/confirm-series", {});
    loadAppointments();
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await patch("/appointments/" + id + "/status", { status: newStatus });
    loadAppointments();
  };

  const openMoveDialog = (a: Appointment) => {
    setMoveTarget(a);
    setMoveDate(a.date);
    setMoveTime(a.time);
    setMoveReason('');
    setMoveError('');
  };

  const closeMoveDialog = () => {
    setMoveTarget(null);
    setMoveError('');
  };

  const handleMove = async () => {
    if (!moveTarget || !moveDate || !moveTime) return;
    setMoving(true);
    setMoveError('');
    const res = await patch("/mfa/appointments/" + moveTarget.id + "/move", {
      newDate: moveDate,
      newTime: moveTime,
      reason: moveReason || undefined,
    });
    setMoving(false);
    if (res.success) {
      setMoveTarget(null);
      loadAppointments();
    } else {
      setMoveError(res.error || 'Verschieben fehlgeschlagen');
    }
  };

  const byStatus = filter === 'ALL'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const searchTerm = search.trim().toLowerCase();
  const filtered = searchTerm === ''
    ? byStatus
    : byStatus.filter((a) =>
        a.patient_first_name.toLowerCase().includes(searchTerm) ||
        a.patient_last_name.toLowerCase().includes(searchTerm) ||
        (a.patient_first_name + ' ' + a.patient_last_name).toLowerCase().includes(searchTerm) ||
        (a.patient_last_name + ' ' + a.patient_first_name).toLowerCase().includes(searchTerm) ||
        a.insurance_number.toLowerCase().includes(searchTerm)
      );

  const weekGroups: Record<string, { label: string; weekStart: Date; items: Appointment[] }> = {};
  for (const a of filtered) {
    const key = weekGroupKey(a.date);
    if (!weekGroups[key]) {
      weekGroups[key] = { label: weekGroupLabel(a.date), weekStart: getISOWeekInfo(a.date).weekStart, items: [] };
    }
    weekGroups[key].items.push(a);
  }
  const weekKeys = Object.keys(weekGroups).sort(
    (a, b) => weekGroups[b].weekStart.getTime() - weekGroups[a].weekStart.getTime()
  );
  for (const key of weekKeys) {
    weekGroups[key].items.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }

  const counts: Record<string, number> = {};
  for (const a of appointments) {
    counts[a.status] = (counts[a.status] || 0) + 1;
  }
  counts['ALL'] = appointments.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Alle Termine</h1>
        <div className="flex gap-1">
          {['ALL', ...Object.keys(STATUS_MAP)].map((s) => {
            if (!counts[s] && s !== 'ALL') return null;
            return (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? 'default' : 'outline'}
                onClick={() => setFilter(s)}
                className="text-xs"
              >
                {s === 'ALL' ? 'Alle' : STATUS_MAP[s]}
                <span className="ml-1.5 opacity-70">({counts[s] || 0})</span>
              </Button>
            );
          })}
        </div>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suche nach Patientenname oder Versichertennummer..."
        className="max-w-sm"
      />

      {loading && <p className="text-muted-foreground">Lade Termine...</p>}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Keine Termine gefunden.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {weekKeys.map((key) => (
          <div key={key} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              {weekGroups[key].label}
              <Badge variant="outline" className="font-normal">{weekGroups[key].items.length} Termine</Badge>
            </h2>
            {weekGroups[key].items.map((a) => (
              <Card key={a.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{a.patient_last_name}, {a.patient_first_name}</span>
                        <span className="text-xs text-muted-foreground">({a.insurance_number})</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {a.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {a.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5" />
                          Dr. {a.doctor_last_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {CATEGORY_LABEL[a.category] || a.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.status === "PENDING_CONFIRMATION" && (
                        <Button size="sm" variant="default" onClick={() => handleConfirm(a.id)}>
                          Bestätigen
                        </Button>
                      )}
                      {a.status === "SCHEDULED" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(a.id, "CHECKED_IN")}>
                            Check-In
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleStatusChange(a.id, "CANCELLED")}>
                            Stornieren
                          </Button>
                        </>
                      )}
                      {a.status !== "COMPLETED" && a.status !== "CANCELLED" && a.status !== "NO_SHOW" && (
                        <Button size="sm" variant="outline" onClick={() => openMoveDialog(a)}>
                          <CalendarClock className="h-3.5 w-3.5 mr-1" />
                          Verschieben
                        </Button>
                      )}
                      <Badge variant={(STATUS_BADGE[a.status] || 'outline') as any}>
                        {STATUS_MAP[a.status] || a.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>

      {moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Card className="w-full max-w-md bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999]">
            <CardHeader><CardTitle className="text-base">Termin verschieben</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {moveError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{moveError}</div>
              )}
              <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {moveTarget.patient_last_name}, {moveTarget.patient_first_name}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{moveTarget.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{moveTarget.time}</span>
                  <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" />Dr. {moveTarget.doctor_last_name}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Neues Datum *</Label>
                <Input type="date" value={moveDate} onChange={(e) => { setMoveDate(e.target.value); setMoveTime(''); }} />
              </div>
              <div className="space-y-1">
                <Label>Neue Uhrzeit *</Label>
                {moveSlotsLoading && <p className="text-sm text-muted-foreground">Lade verfügbare Slots...</p>}
                {!moveSlotsLoading && moveSlotsError && (
                  <>
                    <p className="text-xs text-amber-700">{moveSlotsError} – Uhrzeit manuell eingeben:</p>
                    <Input type="time" value={moveTime} onChange={(e) => setMoveTime(e.target.value)} />
                  </>
                )}
                {!moveSlotsLoading && !moveSlotsError && moveSlots.length === 0 && (
                  <p className="text-sm text-muted-foreground">Keine freien Slots an diesem Tag.</p>
                )}
                {!moveSlotsLoading && !moveSlotsError && moveSlots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {moveSlots.map((t) => (
                      <Button
                        key={t}
                        type="button"
                        size="sm"
                        variant={moveTime === t ? "default" : "outline"}
                        onClick={() => setMoveTime(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label>Grund</Label>
                <Input value={moveReason} onChange={(e) => setMoveReason(e.target.value)} placeholder="Optional" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={closeMoveDialog} disabled={moving}>Abbrechen</Button>
                <Button onClick={handleMove} disabled={moving || !moveDate || !moveTime}>
                  {moving ? "..." : "Verschieben"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


