import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { get, patch } from '@/lib/api';
import { formatDate } from "@/lib/utils";

interface Prescription {
  id: number;
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

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Ausstehend',
  IN_PROGRESS: 'In Prüfung',
  APPROVED: 'Freigegeben',
  REJECTED: 'Abgelehnt',
  COLLECTED: 'Abgeholt',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'default',
  APPROVED: 'default',
  REJECTED: 'destructive',
  COLLECTED: 'outline',
};

const RX_NEXT_STATUS: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: [],
  APPROVED: ['COLLECTED'],
  REJECTED: [],
  COLLECTED: [],
};

export default function MFAPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filter, setFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    get<Prescription[]>('/prescriptions/all').then((r) => {
      if (r.success && r.data) setPrescriptions(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    await patch('/prescriptions/' + id + '/status', { status: newStatus });
    loadData();
  };

  const filtered = filter === 'ALL'
    ? prescriptions
    : prescriptions.filter((p) => p.status === filter);

  const counts: Record<string, number> = {};
  for (const p of prescriptions) {
    counts[p.status] = (counts[p.status] || 0) + 1;
  }
  counts['ALL'] = prescriptions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rezeptverwaltung</h1>
        <div className="flex gap-1 flex-wrap">
          {['ALL', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COLLECTED'].map((s) => {
            if (!counts[s]) return null;
            return (
              <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)} className="text-xs">
                {s === 'ALL' ? 'Alle' : STATUS_MAP[s]}
                <span className="ml-1 opacity-70">({counts[s]})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Lade Rezepte...</p>}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Keine Rezepte gefunden.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((rx) => (
          <Card key={rx.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{rx.medication_name}</span>
                    {rx.dosage && (
                      <span className="text-sm text-muted-foreground">({rx.dosage})</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rx.patient_last_name}, {rx.patient_first_name} ({rx.insurance_number})
                    {' Â· '}Dr. {rx.doctor_last_name}
                    {' Â· '}angefragt: {rx.request_date}
                  </div>
                  {rx.notes && (
                    <div className="text-xs italic bg-muted p-2 rounded inline-block">{rx.notes}</div>
                  )}
                  {rx.status !== 'COLLECTED' && rx.status !== 'REJECTED' && (
                    <div className="flex gap-1 pt-1">
                      {RX_NEXT_STATUS[rx.status]?.map((ns) => (
                        <Button
                          key={ns}
                          size="xs"
                          variant={
                            ns === 'IN_PROGRESS' ? 'default' :
                            ns === 'REJECTED' ? 'destructive' : 'outline'
                          }
                          onClick={() => handleStatusChange(rx.id, ns)}
                          className="text-xs"
                        >
                          {ns === 'IN_PROGRESS' ? 'Prüfen' :
                           ns === 'APPROVED' ? 'Freigeben' :
                           ns === 'REJECTED' ? 'Ablehnen' :
                           ns === 'COLLECTED' ? 'Abgeholt' : ns}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant={(STATUS_BADGE[rx.status] || 'outline') as any}>
                  {STATUS_MAP[rx.status] || rx.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}







