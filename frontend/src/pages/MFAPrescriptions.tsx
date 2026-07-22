import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { get, post, patch } from '@/lib/api';
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
  mfa_approved: 'MFA geprüfung',
  mfa_rejected: 'MFA abgelehnt',
  doctor_approved: 'Arzt freigegeben',
  doctor_rejected: 'Arzt abgelehnt',
  collected: 'Abgeholt',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'secondary',
  mfa_approved: 'default',
  mfa_rejected: 'destructive',
  doctor_approved: 'default',
  doctor_rejected: 'destructive',
  collected: 'outline',
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
  const [error, setError] = useState('');

  const handleForwardToDoctor = async (id: number) => {
    const r = await post('/prescriptions/' + id + '/mfa-approve', { mfaUserId: 1 });
    if (!r.success) { alert(r.error || 'Fehler'); return; }
    loadData();
  };

  const handleRejectByMfa = async (id: number) => {
    const reason = prompt('Grund für die Ablehnung:');
    if (reason === null) return;
    const r = await post('/prescriptions/' + id + '/mfa-reject', { mfaUserId: 1, reason: reason || '' });
    if (!r.success) { alert(r.error || 'Fehler'); return; }
    loadData();
  };

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
          {['ALL', 'PENDING', 'mfa_approved', 'mfa_rejected', 'auto_rejected', 'doctor_approved', 'doctor_rejected', 'collected'].map((s) => {
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
                    {' - '}Dr. {rx.doctor_last_name}
                    {' - '}angefragt: {rx.request_date}
                  </div>
                  {rx.notes && (
                    <div className="text-xs italic bg-muted p-2 rounded inline-block">{rx.notes}</div>
                  )}
                  {rx.status === 'PENDING' && (
                    <div className="flex gap-1 pt-1">
                      <Button size="xs" variant="default" onClick={() => handleForwardToDoctor(rx.id)} className="text-xs">
                        An Arzt weiterleiten
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => handleRejectByMfa(rx.id)} className="text-xs">
                        Ablehnen
                      </Button>
                    </div>
                  )}
                  {rx.status === 'doctor_approved' && (
                    <div className="flex gap-1 pt-1">
                      <Button size="xs" variant="default" onClick={() => handleStatusChange(rx.id, 'collected')} className="text-xs">
                        Abgeholt
                      </Button>
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





