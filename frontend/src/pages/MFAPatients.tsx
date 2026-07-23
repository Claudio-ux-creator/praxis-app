import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, Phone, Mail, AlertTriangle, Stethoscope, MessageSquare, ShieldCheck, ShieldAlert, UserPlus, Pencil, Trash2 } from "lucide-react";
import { get, post, patch, del } from "@/lib/api";

interface Patient {
  id: number;
  insurance_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string | null;
  no_show_count: number;
  insurance_type: "public" | "private" | null;
  created_by_mfa_id: number | null;
  mfa_comment: string | null;
}

interface Diagnosis {
  id: number;
  icd_code: string;
  diagnosis_text: string;
  diagnosis_date: string;
  notes: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
}

export default function MFAPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showDiagnoses, setShowDiagnoses] = useState<Patient | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editInsType, setEditInsType] = useState<"public" | "private">("public");
  const [editComment, setEditComment] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{appointmentCount: number; prescriptionCount: number; diagnosisCount: number} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newIns, setNewIns] = useState("");
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newInsType, setNewInsType] = useState<"public" | "private">("public");
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const loadPatients = () => {
    setLoading(true);
    get<Patient[]>("/patients").then((r: any) => {
      if (r.success && r.data) setPatients(r.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadPatients(); }, []);

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

  const openDiagnoses = (p: Patient) => {
    setShowDiagnoses(p);
    setLoadingDiagnoses(true);
    get<Diagnosis[]>("/patients/" + p.id + "/diagnoses").then((r) => {
      if (r.success && r.data) setDiagnoses(r.data);
      else setDiagnoses([]);
      setLoadingDiagnoses(false);
    });
  };

  const openEdit = (p: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditPatient(p);
    setEditFirst(p.first_name);
    setEditLast(p.last_name);
    setEditDob(p.date_of_birth);
    setEditPhone(p.phone);
    setEditEmail(p.email || "");
    setEditInsType(p.insurance_type || "public");
    setEditComment(p.mfa_comment || "");
  };

  const handleEditSave = async () => {
    if (!editPatient || !editFirst || !editLast || !editDob || !editPhone) return;
    setEditSaving(true);
    const r = await patch("/patients/" + editPatient.id, {
      firstName: editFirst, lastName: editLast, dateOfBirth: editDob, phone: editPhone,
      email: editEmail || undefined, emailOptIn: false, insuranceType: editInsType,
      mfaComment: editComment || undefined,
    });
    setEditSaving(false);
    if (r.success) { setEditPatient(null); loadPatients(); }
    else { alert(r.error || "Fehler beim Speichern"); }
  };

  const openDelete = async (p: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletePatient(p);
    setDeleteInfo(null);
    try {
      const r = await del("/patients/" + p.id);
      if (r.success) setDeleteInfo((r as any).data);
    } catch {}
  };

  const handleDeleteForce = async () => {
    if (!deletePatient) return;
    setDeleting(true);
    const r = await del("/patients/" + deletePatient.id + "/force");
    setDeleting(false);
    if (r.success) { setDeletePatient(null); setDeleteInfo(null); loadPatients(); }
    else { alert(r.error || "Fehler beim Löschen"); }
  };

  const handleCreatePatient = async () => {
    if (!newIns || !newFirst || !newLast || !newDob || !newPhone) return;
    setSaving(true);
    const mfaInfo = localStorage.getItem("mfa_info");
    let createdByMfaId = null;
    if (mfaInfo) {
      try { const m = JSON.parse(mfaInfo); createdByMfaId = m.id; } catch {}
    }
    const r = await post("/patients", {
      insuranceNumber: newIns, firstName: newFirst, lastName: newLast, dateOfBirth: newDob,
      phone: newPhone, email: newEmail || undefined, emailOptIn: false,
      insuranceType: newInsType, createdByMfaId, mfaComment: newComment || undefined,
    });
    setSaving(false);
    if (r.success) {
      setShowNewForm(false);
      setNewIns(""); setNewFirst(""); setNewLast(""); setNewDob("");
      setNewPhone(""); setNewEmail(""); setNewInsType("public"); setNewComment("");
      loadPatients();
    } else { alert(r.error || "Fehler beim Anlegen"); }
  };

  const handleSaveComment = async (patientId: number, comment: string) => {
    const r = await patch("/patients/" + patientId + "/comment", { mfaComment: comment });
    if (r.success) {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, mfa_comment: comment } : p));
      if (showDiagnoses?.id === patientId) setShowDiagnoses(prev => prev ? { ...prev, mfa_comment: comment } : null);
    }
  };

  const resetNewForm = () => {
    setNewIns(""); setNewFirst(""); setNewLast(""); setNewDob("");
    setNewPhone(""); setNewEmail(""); setNewInsType("public"); setNewComment("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold">Patienten</h1>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => { resetNewForm(); setShowNewForm(true); }}>
            <UserPlus className="h-4 w-4 mr-1" /> Neuer Patient
          </Button>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Lade Patienten...</p>}

      {!loading && filtered.length === 0 && (
        <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">Keine Patienten gefunden.</p></CardContent></Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id} className="transition-all hover:border-primary hover:shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {p.last_name}, {p.first_name}
                    {p.insurance_type === "private" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">Privat</Badge>}
                  </CardTitle>
                  <CardDescription>Vers.-Nr.: {p.insurance_number} · geb. {p.date_of_birth}</CardDescription>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => openEdit(p, e)} title="Bearbeiten">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={(e) => openDelete(p, e)} title="Löschen">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pt-0 cursor-pointer" onClick={() => openDiagnoses(p)}>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {p.phone}</div>
              {p.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {p.email}</div>}
              {p.mfa_comment && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1">
                  <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="italic">{p.mfa_comment}</span>
                </div>
              )}
              {p.no_show_count >= 2 && (
                <div className="flex items-center gap-2 text-destructive text-xs font-medium pt-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> No-Shows: {p.no_show_count}
                </div>
              )}
              <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1 border-t mt-2">
                <Stethoscope className="h-3 w-3" /> <span>Klick für Diagnosen</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Neuer Patient Dialog */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999]">
            <h3 className="text-base font-semibold mb-4">Neuen Patienten anlegen</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Vorname *</Label><Input value={newFirst} onChange={(e) => setNewFirst(e.target.value)} placeholder="Max" /></div>
                <div className="space-y-1"><Label>Nachname *</Label><Input value={newLast} onChange={(e) => setNewLast(e.target.value)} placeholder="Mustermann" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Versichertennummer *</Label><Input value={newIns} onChange={(e) => setNewIns(e.target.value)} placeholder="A123456789" /></div>
                <div className="space-y-1"><Label>Geburtsdatum *</Label><Input type="date" value={newDob} onChange={(e) => setNewDob(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Telefon *</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+49 176 12345678" /></div>
                <div className="space-y-1"><Label>E-Mail</Label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="max@example.com" /></div>
              </div>
              <div className="space-y-1">
                <Label>Versicherungsart *</Label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="newInsType" value="public" checked={newInsType === "public"} onChange={() => setNewInsType("public")} className="h-4 w-4" /><ShieldCheck className="h-4 w-4 text-blue-600" /><span className="text-sm">Gesetzlich versichert</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="newInsType" value="private" checked={newInsType === "private"} onChange={() => setNewInsType("private")} className="h-4 w-4" /><ShieldAlert className="h-4 w-4 text-amber-600" /><span className="text-sm">Privat versichert</span></label>
                </div>
              </div>
              <div className="space-y-1"><Label>Kommentar (für den Arzt)</Label><Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="z. B. Bitte prüfen Sie Diagnose XYZ" rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowNewForm(false)}>Abbrechen</Button>
                <Button onClick={handleCreatePatient} disabled={!newIns || !newFirst || !newLast || !newDob || !newPhone || saving}>{saving ? "Wird angelegt..." : "Patient anlegen"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bearbeiten Dialog */}
      {editPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999]">
            <h3 className="text-base font-semibold mb-4">Patient bearbeiten</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Vorname *</Label><Input value={editFirst} onChange={(e) => setEditFirst(e.target.value)} /></div>
                <div className="space-y-1"><Label>Nachname *</Label><Input value={editLast} onChange={(e) => setEditLast(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Versichertennummer</Label><Input value={editPatient.insurance_number} disabled className="bg-muted/50" /></div>
                <div className="space-y-1"><Label>Geburtsdatum *</Label><Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Telefon *</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
                <div className="space-y-1"><Label>E-Mail</Label><Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></div>
              </div>
              <div className="space-y-1">
                <Label>Versicherungsart *</Label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="editInsType" value="public" checked={editInsType === "public"} onChange={() => setEditInsType("public")} className="h-4 w-4" /><ShieldCheck className="h-4 w-4 text-blue-600" /><span className="text-sm">Gesetzlich</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="editInsType" value="private" checked={editInsType === "private"} onChange={() => setEditInsType("private")} className="h-4 w-4" /><ShieldAlert className="h-4 w-4 text-amber-600" /><span className="text-sm">Privat</span></label>
                </div>
              </div>
              <div className="space-y-1"><Label>MFA-Kommentar</Label><Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditPatient(null)}>Abbrechen</Button>
                <Button onClick={handleEditSave} disabled={!editFirst || !editLast || !editDob || !editPhone || editSaving}>{editSaving ? "Wird gespeichert..." : "Speichern"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Löschen Dialog */}
      {deletePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999]">
            <h3 className="text-base font-semibold mb-2">Patient löschen</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Möchten Sie <strong>{deletePatient.last_name}, {deletePatient.first_name}</strong> wirklich löschen?
            </p>
            {deleteInfo && (deleteInfo.appointmentCount > 0 || deleteInfo.prescriptionCount > 0 || deleteInfo.diagnosisCount > 0) && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <p className="font-medium text-amber-800 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Verknüpfte Daten</p>
                <ul className="text-amber-700 mt-1 space-y-0.5 text-xs">
                  {deleteInfo.appointmentCount > 0 && <li>{deleteInfo.appointmentCount} Termin(e)</li>}
                  {deleteInfo.prescriptionCount > 0 && <li>{deleteInfo.prescriptionCount} Rezept(e)</li>}
                  {deleteInfo.diagnosisCount > 0 && <li>{deleteInfo.diagnosisCount} Diagnose(n)</li>}
                </ul>
                <p className="text-xs text-amber-600 mt-2">Diese Daten werden ebenfalls gelöscht.</p>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setDeletePatient(null); setDeleteInfo(null); }}>Abbrechen</Button>
              <Button variant="destructive" onClick={handleDeleteForce} disabled={deleting}>{deleting ? "Wird gelöscht..." : "Endgültig löschen"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosen Dialog */}
      {showDiagnoses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold">{showDiagnoses.last_name}, {showDiagnoses.first_name}</h3>
                <p className="text-xs text-muted-foreground">Vers.-Nr.: {showDiagnoses.insurance_number}{showDiagnoses.insurance_type === "private" ? " · Privatversichert" : ""}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDiagnoses(null)}>Schließen</Button>
            </div>

            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <Label className="text-xs font-medium flex items-center gap-1 mb-1"><MessageSquare className="h-3 w-3" /> MFA-Kommentar</Label>
              <Textarea value={showDiagnoses.mfa_comment || ""} onChange={(e) => setShowDiagnoses(prev => prev ? { ...prev, mfa_comment: e.target.value } : null)} placeholder="Kein Kommentar. Hier Notiz für den Arzt hinterlegen..." rows={2} className="text-sm" />
              <Button size="sm" variant="outline" className="mt-2 text-xs h-7" onClick={() => handleSaveComment(showDiagnoses.id, showDiagnoses.mfa_comment || "")}>Kommentar speichern</Button>
            </div>

            <div>
              <h4 className="text-sm font-medium flex items-center gap-1 mb-2"><Stethoscope className="h-4 w-4" /> Diagnosen</h4>
              {loadingDiagnoses && <p className="text-sm text-muted-foreground">Lade Diagnosen...</p>}
              {!loadingDiagnoses && diagnoses.length === 0 && <p className="text-sm text-muted-foreground">Keine Diagnosen eingetragen.</p>}
              <div className="space-y-2">
                {diagnoses.map((d) => (
                  <Card key={d.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary">{d.icd_code}</Badge>
                        <div>
                          <p className="font-medium text-sm">{d.diagnosis_text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Dr. {d.doctor_last_name} · {d.diagnosis_date}</p>
                          {d.notes && <p className="text-xs text-muted-foreground mt-1 italic">Notiz: {d.notes}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
