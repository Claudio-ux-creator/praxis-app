import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Stethoscope, FileText } from 'lucide-react';
import { get } from '@/lib/api';

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

export default function MFAAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<Appointment[]>('/mfa/appointments').then((r) => {
      if (r.success && r.data) setAppointments(r.data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'ALL'
    ? appointments
    : appointments.filter((a) => a.status === filter);

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

      {loading && <p className="text-muted-foreground">Lade Termine...</p>}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Keine Termine gefunden.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((a) => (
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
                <Badge variant={(STATUS_BADGE[a.status] || 'outline') as any}>
                  {STATUS_MAP[a.status] || a.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
