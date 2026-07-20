import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail, AlertTriangle } from 'lucide-react';
import { get } from '@/lib/api';
import { formatDate } from "@/lib/utils";

interface Patient {
  id: number;
  insurance_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string | null;
  no_show_count: number;
}

export default function MFAPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get<Patient[]>('/patients').then((r) => {
      if (r.success && r.data) setPatients(r.data);
      setLoading(false);
    });
  }, []);

  // Filter by search
  const filtered = patients.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.insurance_number.toLowerCase().includes(q) ||
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patienten</h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen (Name, Vers.-Nr., Telefon)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Lade Patienten...</p>}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Keine Patienten gefunden.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {p.last_name}, {p.first_name}
              </CardTitle>
              <CardDescription>
                Vers.-Nr.: {p.insurance_number}
                {' · '}geb. {p.date_of_birth}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {p.phone}
              </div>
              {p.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {p.email}
                </div>
              )}
              {p.no_show_count >= 2 && (
                <div className="flex items-center gap-2 text-destructive text-xs font-medium pt-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  No-Shows: {p.no_show_count}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


