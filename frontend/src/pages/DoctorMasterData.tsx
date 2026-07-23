import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Search, Stethoscope, Pill, Clock, XCircle, CheckCircle, User, Phone, Mail, MessageSquare, AlertTriangle } from 'lucide-react';
import { get, post, put, patch, del } from '@/lib/api';

interface Medication {
  id: number;
  name: string;
  active_ingredient: string | null;
  strength: string | null;
  form: string | null;
}

interface Diagnosis {
  id: number;
  icd_code: string;
  diagnosis_text: string;
  diagnosis_date: string;
  notes: string | null;
  patient_first_name: string;
  patient_last_name: string;
  insurance_number: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

interface DoctorInfo {
  id: number;
  first_name: string;
  last_name: string;
}

interface AvailabilitySlot {
  id: number;
  doctor_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: number;
}

interface Patient {
  id: number;
  insurance_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string | null;
  no_show_count: number;
  insurance_type: 'public' | 'private' | null;
  created_by_mfa_id: number | null;
  mfa_comment: string | null;
}

interface PatientDiagnosis {
  id: number;
  icd_code: string;
  diagnosis_text: string;
  diagnosis_date: string;
  notes: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
}

export default function DoctorMasterData() {
  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [diagSearch, setDiagSearch] = useState('');
  const [showMedForm, setShowMedForm] = useState(false);
  const [editMedId, setEditMedId] = useState<number | null>(null);
  const [medName, setMedName] = useState('');
  const [medIngredient, setMedIngredient] = useState('');
  const [medStrength, setMedStrength] = useState('');
  const [medForm, setMedForm] = useState('');
  const [showDiagForm, setShowDiagForm] = useState(false);
  const [diagInsurance, setDiagInsurance] = useState('');
  const [diagIcd, setDiagIcd] = useState('');
  const [diagText, setDiagText] = useState('');
  const [diagDate, setDiagDate] = useState('');
  const [diagNotes, setDiagNotes] = useState('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [newSlotWeekday, setNewSlotWeekday] = useState(1);
  const [newSlotStart, setNewSlotStart] = useState('08:00');
  const [newSlotEnd, setNewSlotEnd] = useState('12:00');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDiagnoses, setPatientDiagnoses] = useState<PatientDiagnosis[]>([]);
  const [loadingPatientDiagnoses, setLoadingPatientDiagnoses] = useState(false);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [editDiagId, setEditDiagId] = useState<number | null>(null);
  const [diagIcdInput, setDiagIcdInput] = useState('');
  const [diagTextInput, setDiagTextInput] = useState('');
  const [diagDateInput, setDiagDateInput] = useState('');
  const [diagNotesInput, setDiagNotesInput] = useState('');
  const [savingDiag, setSavingDiag] = useState(false);
  const [showHistory, setShowHistory] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [criticalMeds, setCriticalMeds] = useState<any[]>([]);
  const [loadingCritical, setLoadingCritical] = useState(false);
  const [showCritModal, setShowCritModal] = useState(false);
  const [critEditId, setCritEditId] = useState(null);
  const [critName, setCritName] = useState("");
  const [critIngredient, setCritIngredient] = useState("");
  const [critAtc, setCritAtc] = useState("");
  const [critNotes, setCritNotes] = useState("");
  const [savingCrit, setSavingCrit] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingPatient, setSavingPatient] = useState(false);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{appointmentCount: number; prescriptionCount: number; diagnosisCount: number} | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Diagnosis CRUD in modal
  const [editDiagnosisId, setEditDiagnosisId] = useState<number | null>(null);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  // History

  useEffect(() => {
    const stored = localStorage.getItem('doctor_info');
    if (!stored) { navigate('/doctor-login'); return; }
    setDoctorInfo(JSON.parse(stored));
    loadMedications();
    loadDiagnoses();
  }, []);

  const loadSlots = () => {
    if (!doctorInfo) return;
    setLoadingSlots(true);
    get<AvailabilitySlot[]>('/doctor/availability?doctorId=' + doctorInfo.id).then((r) => {
      if (r.success && r.data) setSlots(r.data);
      setLoadingSlots(false);
    });
  };

  useEffect(() => { if (doctorInfo) loadSlots(); }, [doctorInfo]);
  useEffect(() => { if (doctorInfo) loadCriticalMeds(); }, [doctorInfo]);

  useEffect(() => {
    if (doctorInfo) {
      setLoadingPatients(true);
      get<Patient[]>('/patients').then((r) => {
        if (r.success && r.data) setPatients(r.data);
        setLoadingPatients(false);
      });
    }
  }, [doctorInfo]);

  const handleAddSlot = () => {
    setNewSlotWeekday(1);
    setNewSlotStart('08:00');
    setNewSlotEnd('12:00');
    setShowSlotForm(true);
  };

  const handleSlotSave = async () => {
    if (!doctorInfo) return;
    const r = await post('/doctor/availability', {
      doctorId: doctorInfo.id, weekday: newSlotWeekday, startTime: newSlotStart, endTime: newSlotEnd
    });
    if (r.success) { setShowSlotForm(false); loadSlots(); }
  };

  const handleToggleSlot = async (id: number, currentActive: number) => {
    await put('/doctor/availability/' + id, { isActive: currentActive === 0 });
    loadSlots();
  };

  const handleDeleteSlot = async (id: number) => {
    await del('/doctor/availability/' + id);
    loadSlots();
  };

  const loadMedications = () => {
    get<Medication[]>('/doctor/medications').then((r) => {
      if (r.success && r.data) setMedications(r.data);
    });
  };

  const loadDiagnoses = () => {
    get<Diagnosis[]>('/doctor/diagnoses').then((r) => {
      if (r.success && r.data) setDiagnoses(r.data);
    });
  };

  const handleMedSave = async () => {
    if (!medName) return;
    if (editMedId) {
      await patch('/doctor/medications/' + editMedId, { name: medName, activeIngredient: medIngredient, strength: medStrength, form: medForm });
    } else {
      await post('/doctor/medications', { name: medName, activeIngredient: medIngredient, strength: medStrength, form: medForm });
    }
    setShowMedForm(false);
    setEditMedId(null);
    setMedName(''); setMedIngredient(''); setMedStrength(''); setMedForm('');
    loadMedications();
  };

  const handleMedEdit = (m: Medication) => {
    setEditMedId(m.id);
    setMedName(m.name);
    setMedIngredient(m.active_ingredient || '');
    setMedStrength(m.strength || '');
    setMedForm(m.form || '');
    setShowMedForm(true);
  };

  const handleMedDelete = async (id: number) => {
    await del('/doctor/medications/' + id);
    loadMedications();
  };

  const handleDiagSave = async () => {
    if (!diagInsurance || !diagIcd || !diagText || !doctorInfo) return;
    await post('/doctor/diagnoses', {
      insuranceNumber: diagInsurance, icdCode: diagIcd, diagnosisText: diagText,
      diagnosisDate: diagDate || undefined, notes: diagNotes || undefined, doctorId: doctorInfo.id
    });
    setShowDiagForm(false);
    setDiagInsurance(''); setDiagIcd(''); setDiagText(''); setDiagDate(''); setDiagNotes('');
    loadDiagnoses();
  };

  
  const handleSavePatient = async () => {
    if (!doctorInfo || !selectedPatient) return;
    setSavingPatient(true);
    const r = await patch("/patients/" + selectedPatient.id, {
      firstName: editFirstName, lastName: editLastName, dateOfBirth: editDob,
      phone: editPhone, email: editEmail || null,
    });
    if (!r.success) { alert(r.error || "Fehler beim Speichern"); setSavingPatient(false); return; }
    setSavingPatient(false);
    // Update the patient in the list
    setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, first_name: editFirstName, last_name: editLastName, date_of_birth: editDob, phone: editPhone, email: editEmail || null } : p));
    setSelectedPatient(prev => prev ? { ...prev, first_name: editFirstName, last_name: editLastName, date_of_birth: editDob, phone: editPhone, email: editEmail || null } : null);
    setEditPatient(null);
  };

  
  const openDeletePatient = async (p: Patient) => {
    setDeletePatient(p);
    setDeleteInfo(null);
    const r: any = await del("/patients/" + p.id);
    if (r.success && r.data) setDeleteInfo(r.data);
  };

  const handleForceDelete = async () => {
    if (!deletePatient) return;
    setDeleting(true);
    const r: any = await del("/patients/" + deletePatient.id + "/force");
    if (r.success) {
      setPatients(prev => prev.filter(p => p.id !== deletePatient.id));
      setDeletePatient(null);
      if (selectedPatient?.id === deletePatient.id) setSelectedPatient(null);
    } else {
      alert(r.error || "Fehler beim Löschen");
    }
    setDeleting(false);
  };
  const openPatientEdit = () => {
    if (!selectedPatient) return;
    setEditFirstName(selectedPatient.first_name);
    setEditLastName(selectedPatient.last_name);
    setEditDob(selectedPatient.date_of_birth);
    setEditPhone(selectedPatient.phone);
    setEditEmail(selectedPatient.email || "");
    setEditPatient(selectedPatient);
  };
  const loadPtDiags = (pid: number) => {
    setLoadingPatientDiagnoses(true);
    get<PatientDiagnosis[]>('/patients/' + pid + '/diagnoses').then((r: any) => {
      if (r.success && r.data) setPatientDiagnoses(r.data);
      else setPatientDiagnoses([]);
      setLoadingPatientDiagnoses(false);
    });
  };

  const openPatientDiagnoses = (p: Patient) => { setSelectedPatient(p); loadPtDiags(p.id); };

  const openAddDiag = () => {
    setEditDiagId(null);
    setDiagIcdInput("");
    setDiagTextInput("");
    setDiagDateInput(new Date().toISOString().slice(0, 10));
    setDiagNotesInput("");
    setShowAddDiagnosis(true);
  };

  const openEditDiag = (d: PatientDiagnosis) => {
    setEditDiagId(d.id);
    setDiagIcdInput(d.icd_code);
    setDiagTextInput(d.diagnosis_text);
    setDiagDateInput(d.diagnosis_date);
    setDiagNotesInput(d.notes || "");
    setShowAddDiagnosis(true);
  };

  const handleSaveDiag = async () => {
    if (!doctorInfo || !selectedPatient) return;
    if (!diagIcdInput || !diagTextInput) { alert("ICD-Code und Diagnosetext erforderlich"); return; }
    setSavingDiag(true);
    if (editDiagId) {
      const r = await patch("/doctor/diagnoses/" + editDiagId, {
        icdCode: diagIcdInput, diagnosisText: diagTextInput, diagnosisDate: diagDateInput || undefined,
        notes: diagNotesInput || undefined, doctorId: doctorInfo.id,
      });
      if (!r.success) { alert(r.error || "Fehler"); setSavingDiag(false); return; }
    } else {
      const r = await post("/doctor/diagnoses", {
        insuranceNumber: selectedPatient.insurance_number, icdCode: diagIcdInput, diagnosisText: diagTextInput,
        diagnosisDate: diagDateInput || undefined, notes: diagNotesInput || undefined, doctorId: doctorInfo.id,
      });
      if (!r.success) { alert(r.error || "Fehler"); setSavingDiag(false); return; }
    }
    setShowAddDiagnosis(false);
    setSavingDiag(false);
    loadPtDiags(selectedPatient.id);
  };

  const handleDeleteDiag = async (diagId: number) => {
    if (!confirm("Diagnose wirklich löschen?")) return;
    if (!doctorInfo) return;
    const r = await del("/doctor/diagnoses/" + diagId + "?doctorId=" + doctorInfo.id);
    if (!r.success) { alert(r.error || "Fehler"); return; }
    if (selectedPatient) loadPtDiags(selectedPatient.id);
  };

  const openHistory = async (diagId: number) => {
    setShowHistory(diagId);
    setLoadingHistory(true);
    const r: any = await get("/doctor/diagnoses/" + diagId + "/history");
    if (r.success && r.data) setHistoryData(r.data); else setHistoryData([]);
    setLoadingHistory(false);
  };

  

  const loadCriticalMeds = () => {
    setLoadingCritical(true);
    get("/doctor/critical-medications").then((r: any) => {
      if (r.success && r.data) setCriticalMeds(r.data);
      else setCriticalMeds([]);
      setLoadingCritical(false);
    });
  };



  const handleSaveCritical = async () => {
    if (!critName || !doctorInfo) return;
    setSavingCrit(true);
    let r;
    if (critEditId) {
      r = await put("/doctor/critical-medications/" + critEditId, {
        medicationName: critName, activeIngredient: critIngredient || undefined,
        atcCode: critAtc || undefined, notes: critNotes || undefined,
      });
    } else {
      r = await post("/doctor/critical-medications", {
        medicationName: critName, activeIngredient: critIngredient || undefined,
        atcCode: critAtc || undefined, notes: critNotes || undefined, doctorId: doctorInfo.id,
      });
    }
    if (!r.success) { alert(r.error || "Fehler"); setSavingCrit(false); return; }
    setCritName(""); setCritIngredient(""); setCritAtc(""); setCritNotes("");
    setCritEditId(null); setShowCritModal(false); setSavingCrit(false);
    loadCriticalMeds();
  };

  const handleDeleteCritical = async (id: number) => {
    if (!confirm("Kritisches Medikament wirklich aus der Liste entfernen?")) return;
    const r = await del("/doctor/critical-medications/" + id);
    if (r.success) loadCriticalMeds();
  };

  const handleEditCritical = (med) => {
    setCritEditId(med.id);
    setCritName(med.medication_name);
    setCritIngredient(med.active_ingredient || "");
    setCritAtc(med.atc_code || "");
    setCritNotes(med.notes || "");
    setShowCritModal(true);
  };

  const openAddCritModal = () => {
    setCritEditId(null);
    setCritName("");
    setCritIngredient("");
    setCritAtc("");
    setCritNotes("");
    setShowCritModal(true);
  };

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const q = patientSearch.toLowerCase();
    return p.insurance_number.toLowerCase().includes(q) || p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q) || p.phone.includes(q);
  });

  const filteredMeds = medications.filter((m) => {
    if (!medSearch) return true;
    const q = medSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.active_ingredient && m.active_ingredient.toLowerCase().includes(q));
  });

  const filteredDiags = diagnoses.filter((d) => {
    if (!diagSearch) return true;
    const q = diagSearch.toLowerCase();
    return d.icd_code.toLowerCase().includes(q) || d.diagnosis_text.toLowerCase().includes(q) || d.patient_last_name.toLowerCase().includes(q);
  });

  if (!doctorInfo) return null;

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-semibold'>Stammdaten</h1>

      <Tabs defaultValue='patients' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='patients'><User className='h-4 w-4 mr-1' /> Patienten</TabsTrigger>
          <TabsTrigger value='medications'><Pill className='h-4 w-4 mr-1' /> Medikamente</TabsTrigger>
          <TabsTrigger value='diagnoses'><Stethoscope className='h-4 w-4 mr-1' /> Diagnosen</TabsTrigger>
          <TabsTrigger value='availability'><Clock className='h-4 w-4 mr-1' /> Sprechzeiten</TabsTrigger>
          <TabsTrigger value='critical'><AlertTriangle className='h-4 w-4 mr-1' /> Kritische Medikamente</TabsTrigger>
        </TabsList>

        {/* PATIENTEN TAB */}
        <TabsContent value='patients' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium'>Alle Patienten</h3>
            <div className='relative w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input placeholder='Patient suchen...' value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} className='pl-9' />
            </div>
          </div>
          {loadingPatients && <p className='text-muted-foreground'>Lade Patienten...</p>}
          {!loadingPatients && filteredPatients.length === 0 && (
            <Card><CardContent className='py-8 text-center'><p className='text-muted-foreground'>Keine Patienten gefunden.</p></CardContent></Card>
          )}
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {filteredPatients.map((p) => (
              <Card key={p.id} className='cursor-pointer transition-all hover:border-primary hover:shadow-sm' onClick={() => openPatientDiagnoses(p)}>
                <CardHeader className='pb-2'>
                  <div className='flex items-start justify-between'>
                    <CardTitle className='text-base flex items-center gap-2'>
                      {p.last_name}, {p.first_name}
                      {p.insurance_type === 'private' && <Badge variant='outline' className='text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50'>Privat</Badge>}
                    </CardTitle>
                  </div>
                  <CardDescription>Vers.-Nr.: {p.insurance_number} · geb. {p.date_of_birth}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2 text-sm pt-0'>
                  <div className='flex items-center gap-2 text-muted-foreground'><Phone className='h-3.5 w-3.5' /> {p.phone}</div>
                  {p.email && <div className='flex items-center gap-2 text-muted-foreground'><Mail className='h-3.5 w-3.5' /> {p.email}</div>}
                  {p.mfa_comment && (
                    <div className='flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1'>
                      <MessageSquare className='h-3 w-3 mt-0.5 shrink-0' />
                      <span className='italic'>{p.mfa_comment}</span>
                    </div>
                  )}
                  {p.no_show_count >= 2 && (
                    <div className='flex items-center gap-2 text-destructive text-xs font-medium pt-1'>
                      <AlertTriangle className='h-3.5 w-3.5' /> No-Shows: {p.no_show_count}
                    </div>
                  )}
                  <div className='text-xs text-muted-foreground flex items-center gap-1 pt-1 border-t mt-2'>
                    <Stethoscope className='h-3 w-3' /> <span>Klick für Diagnosen</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
                    {selectedPatient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="w-full max-w-2xl bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999] max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold">{selectedPatient.last_name}, {selectedPatient.first_name}</h3>
                    <p className="text-xs text-muted-foreground">Vers.-Nr.: {selectedPatient.insurance_number}{selectedPatient.insurance_type === 'private' ? ' · Privatversichert' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openDeletePatient(selectedPatient)} title="Patient löschen">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={openPatientEdit}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Patient bearbeiten
                    </Button>
                    <Button variant="outline" size="sm" onClick={openAddDiag}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Diagnose hinzufügen
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Schließen</Button>
                  </div>
                </div>


                {editPatient && (
                  <div className="mb-4 p-4 border-2 border-blue-300/50 rounded-xl bg-blue-50/30">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-1"><Pencil className="h-3.5 w-3.5" /> Patientendaten bearbeiten</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Vorname *</Label>
                          <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Nachname *</Label>
                          <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label>Geburtsdatum *</Label>
                          <Input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Telefon *</Label>
                          <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>E-Mail</Label>
                          <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="optional" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setEditPatient(null)} disabled={savingPatient}>Abbrechen</Button>
                        <Button onClick={handleSavePatient} disabled={!editFirstName || !editLastName || !editDob || !editPhone || savingPatient}>
                          {savingPatient ? "Wird gespeichert..." : "Speichern"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {selectedPatient.mfa_comment && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg text-sm">
                    <span className="font-medium flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> MFA-Kommentar:</span>
                    <p className="text-muted-foreground mt-1 italic">{selectedPatient.mfa_comment}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium flex items-center gap-1 mb-2"><Stethoscope className="h-4 w-4" /> Diagnosen</h4>
                  {loadingPatientDiagnoses && <p className="text-sm text-muted-foreground">Lade Diagnosen...</p>}
                  {!loadingPatientDiagnoses && patientDiagnoses.length === 0 && <p className="text-sm text-muted-foreground">Keine Diagnosen eingetragen.</p>}
                  <div className="space-y-2">
                    {patientDiagnoses.map((d) => (
                      <Card key={d.id}>
                        <CardContent className="py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <Badge variant="secondary">{d.icd_code}</Badge>
                              <div className="min-w-0">
                                <p className="font-medium text-sm">{d.diagnosis_text}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Dr. {d.doctor_last_name} · {d.diagnosis_date}</p>
                                {d.notes && <p className="text-xs text-muted-foreground mt-1 italic">Notiz: {d.notes}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openHistory(d.id)} title="Änderungshistorie">
                                <Clock className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDiag(d)} title="Bearbeiten">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteDiag(d.id)} title="Löschen">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {showAddDiagnosis && (
                  <div className="mt-4 p-4 border-2 border-primary/30 rounded-xl bg-muted/20">
                    <h4 className="text-sm font-medium mb-3">{editDiagId ? 'Diagnose bearbeiten' : 'Neue Diagnose'}</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>ICD-Code *</Label>
                          <Input value={diagIcdInput} onChange={(e) => setDiagIcdInput(e.target.value)} placeholder="J06.9" />
                        </div>
                        <div className="space-y-1">
                          <Label>Datum</Label>
                          <Input type="date" value={diagDateInput} onChange={(e) => setDiagDateInput(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Diagnosetext *</Label>
                        <Input value={diagTextInput} onChange={(e) => setDiagTextInput(e.target.value)} placeholder="Diagnosebeschreibung" />
                      </div>
                      <div className="space-y-1">
                        <Label>Notizen</Label>
                        <Textarea value={diagNotesInput} onChange={(e) => setDiagNotesInput(e.target.value)} placeholder="Optionale Notizen" rows={2} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowAddDiagnosis(false)} disabled={savingDiag}>Abbrechen</Button>
                        <Button onClick={handleSaveDiag} disabled={!diagIcdInput || !diagTextInput || savingDiag}>
                          {savingDiag ? 'Wird gespeichert...' : editDiagId ? 'Aktualisieren' : 'Hinzufügen'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {deletePatient && (
                  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6">
                      <h3 className="text-base font-semibold mb-2">Patient löschen</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Möchten Sie <strong>{deletePatient.last_name}, {deletePatient.first_name}</strong> wirklich aus dem System löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setDeletePatient(null)} disabled={deleting}>Abbrechen</Button>
                        <Button variant="destructive" onClick={handleForceDelete} disabled={deleting}>
                          {deleting ? "Wird gelöscht..." : "Endgültig löschen"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {showHistory !== null && (
                  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30">
                    <div className="w-full max-w-lg bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 max-h-[70vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold">Änderungshistorie</h4>
                        <Button variant="ghost" size="sm" onClick={() => setShowHistory(null)}>Schließen</Button>
                      </div>
                      {loadingHistory && <p className="text-sm text-muted-foreground">Lade Historie...</p>}
                      {!loadingHistory && historyData.length === 0 && <p className="text-sm text-muted-foreground">Keine Änderungen aufgezeichnet.</p>}
                      <div className="space-y-3">
                        {historyData.map((h: any) => (
                          <Card key={h.id}>
                            <CardContent className="py-2 px-3">
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant={h.action === 'CREATED' ? 'default' : h.action === 'UPDATED' ? 'secondary' : 'destructive'} className="text-[10px] px-1.5">
                                  {h.action === 'CREATED' ? 'Erstellt' : h.action === 'UPDATED' ? 'Bearbeitet' : 'Gelöscht'}
                                </Badge>
                                <span className="text-muted-foreground">{h.created_at}</span>
                              </div>
                              {h.action === 'UPDATED' && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {h.old_icd_code !== h.new_icd_code && <p>ICD: {h.old_icd_code} → {h.new_icd_code}</p>}
                                  {h.old_diagnosis_text !== h.new_diagnosis_text && <p>Text: {h.old_diagnosis_text?.substring(0, 30)} → {h.new_diagnosis_text?.substring(0, 30)}</p>}
                                </div>
                              )}
                              {h.action === 'CREATED' && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <span>{h.new_icd_code} – {h.new_diagnosis_text?.substring(0, 40)}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </TabsContent>

        {/* DIAGNOSEN TAB */}
        <TabsContent value='diagnoses' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium'>Diagnosen verwalten</h3>
            <div className='flex items-center gap-3'>
              <div className='relative w-56'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input placeholder='Diagnose suchen...' value={diagSearch} onChange={(e) => setDiagSearch(e.target.value)} className='pl-9' />
              </div>
              <Button onClick={() => { setShowDiagForm(true); }}>
                <Plus className='h-4 w-4 mr-1' /> Diagnose hinzufügen
              </Button>
            </div>
          </div>
          {showDiagForm && (
            <Card className='border-primary'>
              <CardHeader><CardTitle className='text-base'>Neue Diagnose</CardTitle></CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid gap-3 md:grid-cols-5'>
                  <div className='space-y-1'><Label>Versichertennr. *</Label><Input value={diagInsurance} onChange={(e) => setDiagInsurance(e.target.value)} placeholder='A123456789' /></div>
                  <div className='space-y-1'><Label>ICD-Code *</Label><Input value={diagIcd} onChange={(e) => setDiagIcd(e.target.value)} placeholder='J06.9' /></div>
                  <div className='space-y-1'><Label>Diagnose *</Label><Input value={diagText} onChange={(e) => setDiagText(e.target.value)} placeholder='Diagnosetext' /></div>
                  <div className='space-y-1'><Label>Datum</Label><Input type='date' value={diagDate} onChange={(e) => setDiagDate(e.target.value)} /></div>
                  <div className='space-y-1'><Label>Notizen</Label><Input value={diagNotes} onChange={(e) => setDiagNotes(e.target.value)} placeholder='Optional' /></div>
                </div>
                <div className='flex gap-2 justify-end pt-2'>
                  <Button variant='outline' onClick={() => setShowDiagForm(false)}>Abbrechen</Button>
                  <Button onClick={handleDiagSave} disabled={!diagInsurance || !diagIcd || !diagText}>Speichern</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {filteredDiags.length === 0 && !showDiagForm && (
            <Card><CardContent className='py-8 text-center'><p className='text-muted-foreground'>Keine Diagnosen gefunden.</p></CardContent></Card>
          )}
          <div className='space-y-2'>
            {filteredDiags.map((d) => (
              <Card key={d.id}>
                <CardContent className='py-3 flex items-center justify-between'>
                  <div className='flex items-start gap-3'>
                    <Badge variant='secondary'>{d.icd_code}</Badge>
                    <div>
                      <span className='font-medium'>{d.diagnosis_text}</span>
                      <p className='text-xs text-muted-foreground mt-1'>Patient: {d.patient_last_name}, {d.patient_first_name} ({d.insurance_number}) - {d.diagnosis_date}</p>
                      {d.notes && <p className='text-xs text-muted-foreground'>Notiz: {d.notes}</p>}
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <Button size='sm' variant='ghost'><Pencil className='h-3.5 w-3.5' /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SPRECHZEITEN TAB */}
        <TabsContent value='availability' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium'>Sprechzeiten verwalten</h3>
            <Button onClick={handleAddSlot}><Plus className='h-4 w-4 mr-1' /> Zeitfenster hinzufügen</Button>
          </div>
          {showSlotForm && (
            <Card className='border-primary'>
              <CardHeader><CardTitle className='text-base'>Neues Zeitfenster</CardTitle></CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid gap-3 md:grid-cols-4'>
                  <div className='space-y-1'>
                    <Label>Wochentag *</Label>
                    <select className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm' value={newSlotWeekday} onChange={(e) => setNewSlotWeekday(Number(e.target.value))}>
                      <option value='1'>Montag</option>
                      <option value='2'>Dienstag</option>
                      <option value='3'>Mittwoch</option>
                      <option value='4'>Donnerstag</option>
                      <option value='5'>Freitag</option>
                    </select>
                  </div>
                  <div className='space-y-1'><Label>Startzeit *</Label><Input type='time' value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} /></div>
                  <div className='space-y-1'><Label>Endzeit *</Label><Input type='time' value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} /></div>
                  <div className='space-y-1'>
                    <Label>&nbsp;</Label>
                    <div className='flex gap-2'>
                      <Button variant='outline' onClick={() => setShowSlotForm(false)}>Abbrechen</Button>
                      <Button onClick={handleSlotSave}>Speichern</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {loadingSlots && <p className='text-muted-foreground'>Lade Sprechzeiten...</p>}
          {!loadingSlots && slots.length === 0 && (
            <Card><CardContent className='py-8 text-center'><p className='text-muted-foreground'>Keine Sprechzeiten eingetragen. Bitte fügen Sie Zeitfenster hinzu.</p></CardContent></Card>
          )}
          {[1,2,3,4,5].map((day) => {
            const daySlots = slots.filter((s) => s.weekday === day);
            if (daySlots.length === 0) return null;
            const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
            return (
              <div key={day} className='space-y-2'>
                <h4 className='font-medium text-sm text-muted-foreground'>{dayNames[day-1]}</h4>
                {daySlots.map((slot) => (
                  <Card key={slot.id}>
                    <CardContent className='py-3 flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <span className='font-medium'>{slot.start_time} - {slot.end_time}</span>
                        {slot.is_active === 0 && <Badge variant='outline'>Inaktiv</Badge>}
                      </div>
                      <div className='flex gap-1'>
                        <Button size='sm' variant='ghost' onClick={() => handleToggleSlot(slot.id, slot.is_active)}>
                          {slot.is_active ? <XCircle className='h-3.5 w-3.5' /> : <CheckCircle className='h-3.5 w-3.5 text-green-600' />}
                        </Button>
                        <Button size='sm' variant='ghost' onClick={() => handleDeleteSlot(slot.id)}><Trash2 className='h-3.5 w-3.5 text-destructive' /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </TabsContent>
      
        {/* KRITISCHE MEDIKAMENTE TAB */}
        <TabsContent value="critical" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Kritische Medikamente verwalten</h3>
            <Button onClick={openAddCritModal}>
              <Plus className="h-4 w-4 mr-1" /> Kritisches Medikament hinzufügen
            </Button>
          </div>

          {loadingCritical && <p className="text-muted-foreground">Lade Liste...</p>}
          {!loadingCritical && criticalMeds.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Keine kritischen Medikamente eingetragen.</p>
                <p className="text-xs text-muted-foreground mt-1">Fügen Sie Medikamente hinzu, die nur nach persönlicher ärztlicher Untersuchung verschrieben werden dürfen.</p>
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            {criticalMeds.map((m) => (
              <Card key={m.id}>
                <CardContent className="py-3 flex items-center justify-between">
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
                    <Button size="sm" variant="outline" onClick={() => handleEditCritical(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteCritical(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* MODAL FÜR HINZUFÜGEN / BEARBEITEN */}
          {showCritModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowCritModal(false)} />
              <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 z-50 border">
                <h3 className="text-lg font-semibold mb-4">
                  {critEditId ? "Kritisches Medikament bearbeiten" : "Kritisches Medikament hinzufügen"}
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label>Medikamentenname *</Label>
                    <Input value={critName} onChange={e => setCritName(e.target.value)} placeholder="z.B. Oxycodon" />
                  </div>
                  <div>
                    <Label>Wirkstoff</Label>
                    <Input value={critIngredient} onChange={e => setCritIngredient(e.target.value)} placeholder="z.B. Oxycodonhydrochlorid" />
                  </div>
                  <div>
                    <Label>ATC-Code</Label>
                    <Input value={critAtc} onChange={e => setCritAtc(e.target.value)} placeholder="z.B. N02AA01" />
                  </div>
                  <div>
                    <Label>Notiz</Label>
                    <Input value={critNotes} onChange={e => setCritNotes(e.target.value)} placeholder="z.B. Nur nach persönlicher Untersuchung" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowCritModal(false)} disabled={savingCrit}>Abbrechen</Button>
                  <Button variant="destructive" onClick={handleSaveCritical} disabled={!critName || savingCrit}>
                    {savingCrit ? "Wird gespeichert..." : critEditId ? "Speichern" : "Hinzufügen"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        </Tabs>
    </div>
  );
}
