import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { get } from '@/lib/api';

interface PrescriptionResult {
  id: number;
  medication_name: string;
  dosage: string | null;
  notes: string | null;
  status: string;
  request_date: string;
  approved_date: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
}

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Ausstehend',
  APPROVED: 'Freigegeben',
  REJECTED: 'Abgelehnt',
  DISPENSED: 'Ausgegeben',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
  DISPENSED: 'outline',
};

export default function PatientPrescriptions() {
  const insuranceNumber = localStorage.getItem('patient_insurance') || '';
  const [prescriptions, setPrescriptions] = useState<PrescriptionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!insuranceNumber) return;
    setLoading(true);
    get<PrescriptionResult[]>('/prescriptions?insuranceNumber=' + insuranceNumber).then((r) => {
      if (r.success && r.data) setPrescriptions(r.data);
      setLoading(false);
    });
  }, [insuranceNumber]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Lade Rezepte...</p></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Meine Rezepte</h1>

      {prescriptions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Sie haben noch keine Rezepte.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {prescriptions.map((p) => (
          <Card key={p.id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.medication_name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.dosage && <span>Dosierung: {p.dosage} &middot; </span>}
                  Dr. {p.doctor_last_name}
                  {' — '}
                  {p.request_date}
                </p>
                {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
              </div>
              <Badge variant={STATUS_BADGE[p.status] as any || 'outline'}>
                {STATUS_MAP[p.status] || p.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
