import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { get, patch } from '@/lib/api';

interface AppointmentResult {
  id: number;
  date: string;
  time: string;
  status: string;
  category: string;
  doctor_id: number;
  series_id: number | null;
  series_dose_number: number | null;
  series_group_id: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
}

// Termine, die weder abgeschlossen noch bereits storniert/nicht wahrgenommen sind, können
// vom Patienten noch abgesagt oder verschoben werden (Backend erzwingt zusätzlich die 2h-Frist).
function isCancellable(status: string): boolean {
  return status !== 'CANCELLED' && status !== 'COMPLETED' && status !== 'NO_SHOW';
}

const STATUS_MAP: Record<string, string> = {
  SCHEDULED: 'Gebucht',
  PENDING_CONFIRMATION: 'Bestätigung ausstehend',
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

export default function PatientAppointments() {
  const insuranceNumber = localStorage.getItem('patient_insurance') || '';
  const [appointments, setAppointments] = useState<AppointmentResult[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verschieben-Modal
  const [moveTarget, setMoveTarget] = useState<AppointmentResult | null>(null);
  const [moveDate, setMoveDate] = useState('');
  const [moveTime, setMoveTime] = useState('');
  const [moveSlots, setMoveSlots] = useState<string[]>([]);
  const [moveSlotsLoading, setMoveSlotsLoading] = useState(false);
  const [moveError, setMoveError] = useState('');
  const [moving, setMoving] = useState(false);

  const loadAppointments = () => {
    setLoading(true);
    get<AppointmentResult[]>('/appointments?insuranceNumber=' + insuranceNumber).then((r) => {
      if (r.success && r.data) setAppointments(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAppointments();
  }, [insuranceNumber]);

  const handleConfirmSuggestion = async (appointmentId: number) => {
    const r = await patch('/appointments/' + appointmentId + '/confirm-suggestion', { insuranceNumber });
    if (r.success) loadAppointments();
  };

  const handleRejectSuggestion = async (appointmentId: number) => {
    const r = await patch('/appointments/' + appointmentId + '/reject-suggestion', { insuranceNumber });
    if (r.success) loadAppointments();
  };

  const handleCancel = async (appointmentId: number) => {
    setError('');
    if (!window.confirm('Diesen Termin wirklich absagen?')) return;
    const r = await patch('/appointments/' + appointmentId + '/cancel', { insuranceNumber });
    if (r.success) {
      loadAppointments();
    } else {
      setError(r.error || 'Absage fehlgeschlagen');
    }
  };

  const openMoveDialog = (a: AppointmentResult) => {
    setMoveTarget(a);
    setMoveDate(a.date);
    setMoveTime(a.time);
    setMoveError('');
    setError('');
  };

  const closeMoveDialog = () => {
    setMoveTarget(null);
    setMoveSlots([]);
    setMoveError('');
  };

  useEffect(() => {
    if (!moveTarget || !moveDate) { setMoveSlots([]); return; }
    setMoveSlotsLoading(true);
    setMoveError('');
    get<{ slots: string[] }>('/slots?doctorId=' + moveTarget.doctor_id + '&date=' + moveDate + '&category=' + moveTarget.category).then((r) => {
      setMoveSlotsLoading(false);
      if (r.success && r.data) {
        let slots = r.data.slots;
        // Der aktuell gebuchte Slot ist durch den eigenen Termin belegt und wird vom Backend
        // ausgeschlossen - am gleichen Datum trotzdem als Option anbieten.
        if (moveDate === moveTarget.date && !slots.includes(moveTarget.time)) {
          slots = [...slots, moveTarget.time].sort();
        }
        setMoveSlots(slots);
      } else {
        setMoveSlots([]);
        setMoveError(r.error || 'Slots konnten nicht geladen werden');
      }
    });
  }, [moveTarget, moveDate]);

  const handleMove = async () => {
    if (!moveTarget || !moveDate || !moveTime) return;
    setMoving(true);
    setMoveError('');
    const r = await patch('/appointments/' + moveTarget.id + '/reschedule', {
      insuranceNumber, newDate: moveDate, newTime: moveTime,
    });
    setMoving(false);
    if (r.success) {
      closeMoveDialog();
      loadAppointments();
    } else {
      setMoveError(r.error || 'Verschieben fehlgeschlagen');
    }
  };

  const filtered = filter === 'ALL'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const counts: Record<string, number> = {};
  for (const a of appointments) {
    counts[a.status] = (counts[a.status] || 0) + 1;
  }
  counts['ALL'] = appointments.length;

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Lade Termine...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Meine Termine</h1>
        <div className="flex gap-1 flex-wrap">
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

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {appointments.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Sie haben noch keine Termine.</p>
            <Button className="mt-4" onClick={() => window.location.href = '/patient/book'}>Termin buchen</Button>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && appointments.length > 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Keine Termine mit diesem Status.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{a.date} um {a.time}</p>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABEL[a.category] || a.category} bei Dr. {a.doctor_last_name}
                  {a.series_dose_number && <span className="ml-2">(Dosis {a.series_dose_number})</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {a.status === 'PENDING_CONFIRMATION' && (a.series_dose_number || 0) > 1 && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleRejectSuggestion(a.id)}>Ablehnen</Button>
                    <Button size="sm" onClick={() => handleConfirmSuggestion(a.id)}>Bestätigen</Button>
                  </>
                )}
                {isCancellable(a.status) && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openMoveDialog(a)}>Verschieben</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleCancel(a.id)}>Absagen</Button>
                  </>
                )}
                <Badge variant={STATUS_BADGE[a.status] as any || 'outline'}>
                  {STATUS_MAP[a.status] || a.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
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
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Aktuell: {moveTarget.date} um {moveTarget.time} Uhr bei Dr. {moveTarget.doctor_last_name}
              </div>
              <div className="space-y-1">
                <Label>Neues Datum *</Label>
                <Input type="date" value={moveDate} onChange={(e) => { setMoveDate(e.target.value); setMoveTime(''); }} />
              </div>
              <div className="space-y-1">
                <Label>Neue Uhrzeit *</Label>
                {moveSlotsLoading && <p className="text-sm text-muted-foreground">Lade verfügbare Slots...</p>}
                {!moveSlotsLoading && !moveError && moveSlots.length === 0 && (
                  <p className="text-sm text-muted-foreground">Keine freien Slots an diesem Tag.</p>
                )}
                {!moveSlotsLoading && moveSlots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {moveSlots.map((t) => (
                      <Button key={t} type="button" size="sm" variant={moveTime === t ? 'default' : 'outline'} onClick={() => setMoveTime(t)}>
                        {t}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={closeMoveDialog} disabled={moving}>Abbrechen</Button>
                <Button onClick={handleMove} disabled={moving || !moveDate || !moveTime}>
                  {moving ? '...' : 'Verschieben'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

