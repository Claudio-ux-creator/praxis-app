import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ClipboardList, Pill } from 'lucide-react';
import { get } from '@/lib/api';
import { formatDate } from "@/lib/utils";

interface AppointmentResult {
  id: number;
  date: string;
  time: string;
  status: string;
  category: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

interface PrescriptionResult {
  id: number;
  medication_name: string;
  dosage: string | null;
  status: string;
  request_date: string;
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

export default function PatientOverview() {
  const navigate = useNavigate();
  const patientName = localStorage.getItem('patient_name') || 'Patient';
  const insuranceNumber = localStorage.getItem('patient_insurance') || '';

  const [appointments, setAppointments] = useState<AppointmentResult[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResult[]>([]);

  useEffect(() => {
    if (!insuranceNumber) return;
    get<AppointmentResult[]>('/appointments?insuranceNumber=' + insuranceNumber).then((r) => {
      if (r.success && r.data) setAppointments(r.data);
    });
    get<PrescriptionResult[]>('/prescriptions?insuranceNumber=' + insuranceNumber).then((r) => {
      if (r.success && r.data) setPrescriptions(r.data);
    });
  }, [insuranceNumber]);

  const nextAppointment = appointments
    .filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];

  const pendingConfirmations = appointments.filter((a) => a.status === 'PENDING_CONFIRMATION');
  const pendingPrescriptions = prescriptions.filter((a) => a.status === 'PENDING' || a.status === 'APPROVED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Willkommen, {patientName}</h1>
        <p className="text-muted-foreground">Versichertennummer: {insuranceNumber}</p>
      </div>

      {/* Nächster Termin */}
      {nextAppointment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Nächster Termin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm"><strong>{nextAppointment.date}</strong> um <strong>{nextAppointment.time}</strong></p>
            <p className="text-sm text-muted-foreground">
              {CATEGORY_LABEL[nextAppointment.category] || nextAppointment.category} bei Dr. {nextAppointment.doctor_last_name}
              {' â€” '}
              <span className="font-medium">{STATUS_MAP[nextAppointment.status] || nextAppointment.status}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => navigate('/patient/book')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Termin buchen
            </CardTitle>
            <CardDescription>Neuen Termin vereinbaren</CardDescription>
          </CardHeader>
        </Card>

        <Card className={'cursor-pointer transition-all hover:shadow-md ' + (pendingConfirmations.length > 0 ? 'hover:border-amber-500 border-amber-200' : 'hover:border-primary')} onClick={() => navigate('/patient/appointments')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Meine Termine
            </CardTitle>
            <CardDescription>
              {appointments.length} Termine
              {pendingConfirmations.length > 0 && (
                <span className="ml-2 text-amber-600 font-semibold">({pendingConfirmations.length} ausstehend)</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className={'cursor-pointer transition-all hover:shadow-md ' + (pendingPrescriptions.length > 0 ? 'hover:border-amber-500 border-amber-200' : 'hover:border-primary')} onClick={() => navigate('/patient/prescriptions')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Rezepte
            </CardTitle>
            <CardDescription>
              {prescriptions.length} Rezepte
              {pendingPrescriptions.length > 0 && (
                <span className="ml-2 text-amber-600 font-semibold">({pendingPrescriptions.length} offen)</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}



