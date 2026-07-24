import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { get, post, put, del } from '@/lib/api';

export default function MFACriticalMedications() {
  const [criticalMeds, setCriticalMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [medName, setMedName] = useState('');
  const [medIngredient, setMedIngredient] = useState('');
  const [medAtc, setMedAtc] = useState('');
  const [medNotes, setMedNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    setLoading(true);
    get<any[]>('/doctor/critical-medications').then((r) => {
      if (r.success && r.data) setCriticalMeds(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const openAddModal = () => {
    setEditId(null); setMedName(''); setMedIngredient(''); setMedAtc(''); setMedNotes(''); setShowModal(true);
  };

  const openEditModal = (m: any) => {
    setEditId(m.id); setMedName(m.medication_name);
    setMedIngredient(m.active_ingredient || '');
    setMedAtc(m.atc_code || '');
    setMedNotes(m.notes || ''); setShowModal(true);
  };

  const handleSave = async () => {
    if (!medName.trim()) return; setSaving(true);
    const payload = { medication_name: medName.trim(), active_ingredient: medIngredient.trim() || null, atc_code: medAtc.trim() || null, notes: medNotes.trim() || null };
    let r; if (editId) { r = await put('/doctor/critical-medications/' + editId, payload); }
    else { r = await post('/doctor/critical-medications', payload); }
    setSaving(false); if (r.success) { setShowModal(false); loadData(); }
    else { alert(r.error || 'Fehler beim Speichern'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Wirklich löschen?')) return;
    const r = await del('/doctor/critical-medications/' + id);
    if (r.success) { loadData(); }
    else { alert(r.error || 'Fehler beim Löschen'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kritische Medikamente</h1>
          <p className="text-sm text-muted-foreground">Medikamente, die nur nach persönlicher ärztlicher Untersuchung verschrieben werden dürfen</p>
        </div>
        <Button onClick={openAddModal}><Plus className="h-4 w-4 mr-1" /> Medikament hinzufügen</Button>
      </div>
      {loading && <p className="text-muted-foreground">Lade Liste...</p>}
      {!loading && criticalMeds.length === 0 && (
        <Card><CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Keine kritischen Medikamente eingetragen.</p>
        </CardContent></Card>
      )}
      <div className="space-y-2">
        {criticalMeds.map((m) => (
          <Card key={m.id}><CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Badge variant="destructive" className="shrink-0">Kritisch</Badge>
              <div className="min-w-0">
                <span className="font-medium">{m.medication_name}</span>
                {m.active_ingredient && <span className="text-sm text-muted-foreground ml-2">({m.active_ingredient})</span>}
                {m.atc_code && <span className="text-xs text-muted-foreground ml-2">ATC: {m.atc_code}</span>}
                {m.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.notes}</p>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0 ml-3">
              <Button size="sm" variant="outline" onClick={() => openEditModal(m)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 z-50 border">
            <h3 className="text-lg font-semibold mb-4">{editId ? 'Kritisches Medikament bearbeiten' : 'Kritisches Medikament hinzufügen'}</h3>
            <div className="space-y-3">
              <div><Label>Medikamentenname *</Label><Input value={medName} onChange={e => setMedName(e.target.value)} placeholder="z.B. Oxycodon" autoFocus /></div>
              <div><Label>Wirkstoff</Label><Input value={medIngredient} onChange={e => setMedIngredient(e.target.value)} placeholder="z.B. Oxycodonhydrochlorid" /></div>
              <div><Label>ATC-Code</Label><Input value={medAtc} onChange={e => setMedAtc(e.target.value)} placeholder="z.B. N02AA01" /></div>
              <div><Label>Notiz</Label><Input value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder="z.B. Nur nach persönlicher Untersuchung" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={!medName.trim() || saving}>{saving ? 'Wird gespeichert...' : editId ? 'Speichern' : 'Hinzufügen'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}