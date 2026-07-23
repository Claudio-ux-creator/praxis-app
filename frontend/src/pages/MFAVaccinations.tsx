import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Syringe } from 'lucide-react';
import { get } from '@/lib/api';

interface VaccineAppointment {
  id: number;
  date: string;
  time: string;
  status: string;
  series_dose_number: number | null;
  series_group_id: string | null;
  patient_first_name: string;
  patient_last_name: string;
  insurance_number: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

interface VaccinationTemplate {
  id: number;
  name: string;
  description: string;
  doses: number;
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Geplant',
  PENDING_CONFIRMATION: 'Ausstehend',
  COMPLETED: 'Abgeschlossen',
  CHECKED_IN: 'Eingecheckt',
  IN_PROGRESS: 'In Behandlung',
  CANCELLED: 'Storniert',
};

export default function MFAVaccinations() {
  const [vaccinations, setVaccinations] = useState<VaccineAppointment[]>([]);
  const [templates, setTemplates] = useState<VaccinationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get<VaccineAppointment[]>('/mfa/vaccinations'),
      get<VaccinationTemplate[]>('/vaccination-series'),
    ]).then(([vRes, tRes]) => {
      if (vRes.success && vRes.data) setVaccinations(vRes.data);
      if (tRes.success && tRes.data) setTemplates(tRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="space-y-6"><h1 className="text-2xl font-semibold">Impfungen</h1><p className="text-muted-foreground">Lade...</p></div>;
  }

  const seriesAppointments = vaccinations.filter((v) => v.series_group_id);
  const singleVaccinations = vaccinations.filter((v) => !v.series_group_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Impfungen</h1>
      </div>

      {/* Impfserien-Vorlagen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Syringe className="h-4 w-4" />
            Impfserien-Vorlagen
          </CardTitle>
          <CardDescription>Verfügbare Impfserien und Dosierungsschemata</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 && <p className="text-sm text-muted-foreground">Keine Vorlagen verfügbar.</p>}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-lg border p-3">
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.doses} Dosen</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Geplante Impftermine */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Impftermine
          </CardTitle>
          <CardDescription>Alle Impftermine - einzeln und als Serie</CardDescription>
        </CardHeader>
        <CardContent>
          {vaccinations.length === 0 && <p className="text-sm text-muted-foreground">Keine Impftermine vorhanden.</p>}
          <div className="space-y-2">
            {vaccinations.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <div className="font-medium">
                    {v.patient_last_name}, {v.patient_first_name} ({v.insurance_number})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {v.date} um {v.time} - Dr. {v.doctor_last_name}
                    {v.series_dose_number && <span> - Dosis {v.series_dose_number}</span>}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {STATUS_LABEL[v.status] || v.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


