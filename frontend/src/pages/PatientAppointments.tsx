import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { get, patch } from '@/lib/api';

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
  const [loading, setLoading] = useState(true);

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

  const handleConfirmSeries = async (appointmentId: number) => {
    const r = await patch('/appointments/' + appointmentId + '/confirm-series', {});
    if (r.success) loadAppointments();
  };

  const pendingConfirmations = appointments.filter((a) => a.status === 'PENDING_CONFIRMATION');
  const scheduledAppointments = appointments.filter((a) => a.status !== 'PENDING_CONFIRMATION');

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Lade Termine...</p></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Meine Termine</h1>

      {appointments.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Sie haben noch keine Termine.</p>
            <Button className="mt-4" onClick={() => window.location.href = '/patient/book'}>Termin buchen</Button>
          </CardContent>
        </Card>
      )}

      {/* Bestätigung ausstehend */}
      {pendingConfirmations.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3 text-amber-700">Bestätigung ausstehend</h2>
          <div className="space-y-3">
            {pendingConfirmations.map((a) => (
              <Card key={a.id} className="border-amber-200">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.date} um {a.time}</p>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORY_LABEL[a.category] || a.category} bei Dr. {a.doctor_last_name}
                      {a.series_dose_number && <span className="ml-2">(Dosis {a.series_dose_number})</span>}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleConfirmSeries(a.id)}>Bestätigen</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Geplante & frühere Termine */}
      {scheduledAppointments.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Alle Termine</h2>
          <div className="space-y-3">
            {scheduledAppointments.map((a) => (
              <Card key={a.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.date} um {a.time}</p>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORY_LABEL[a.category] || a.category} bei Dr. {a.doctor_last_name}
                      {a.series_dose_number && <span className="ml-2">(Dosis {a.series_dose_number})</span>}
                    </p>
                  </div>
                  <Badge variant={STATUS_BADGE[a.status] as any || 'outline'}>
                    {STATUS_MAP[a.status] || a.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
