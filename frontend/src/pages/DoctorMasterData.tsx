import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Search, Stethoscope, Pill, FileText, Clock, XCircle, CheckCircle, User, Phone, Mail, ShieldCheck, ShieldAlert, MessageSquare, AlertTriangle } from 'lucide-react';
import { get, post, put, patch, del } from '@/lib/api';
import { formatDate } from '@/lib/utils';

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

  const openPatientDiagnoses = (p: Patient) => {
    setSelectedPatient(p);
    setLoadingPatientDiagnoses(true);
    get<PatientDiagnosis[]>('/patients/' + p.id + '/diagnoses').then((r) => {
      if (r.success && r.data) setPatientDiagnoses(r.data);
      else setPatientDiagnoses([]);
      setLoadingPatientDiagnoses(false);
    });
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
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
              <div className='w-full max-w-2xl bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 z-[999] max-h-[85vh] overflow-y-auto'>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <h3 className='text-base font-semibold'>{selectedPatient.last_name}, {selectedPatient.first_name}</h3>
                    <p className='text-xs text-muted-foreground'>Vers.-Nr.: {selectedPatient.insurance_number}{selectedPatient.insurance_type === 'private' ? ' · Privatversichert' : ''}</p>
                  </div>
                  <Button variant='ghost' size='sm' onClick={() => setSelectedPatient(null)}>Schließen</Button>
                </div>
                {selectedPatient.mfa_comment && (
                  <div className='mb-4 p-3 bg-muted/30 rounded-lg text-sm'>
                    <span className='font-medium flex items-center gap-1'><MessageSquare className='h-3.5 w-3.5' /> MFA-Kommentar:</span>
                    <p className='text-muted-foreground mt-1 italic'>{selectedPatient.mfa_comment}</p>
                  </div>
                )}
                <div>
                  <h4 className='text-sm font-medium flex items-center gap-1 mb-2'><Stethoscope className='h-4 w-4' /> Diagnosen</h4>
                  {loadingPatientDiagnoses && <p className='text-sm text-muted-foreground'>Lade Diagnosen...</p>}
                  {!loadingPatientDiagnoses && patientDiagnoses.length === 0 && <p className='text-sm text-muted-foreground'>Keine Diagnosen eingetragen.</p>}
                  <div className='space-y-2'>
                    {patientDiagnoses.map((d) => (
                      <Card key={d.id}>
                        <CardContent className='py-3'>
                          <div className='flex items-start gap-2'>
                            <Badge variant='secondary'>{d.icd_code}</Badge>
                            <div>
                              <p className='font-medium text-sm'>{d.diagnosis_text}</p>
                              <p className='text-xs text-muted-foreground mt-0.5'>Dr. {d.doctor_last_name} · {d.diagnosis_date}</p>
                              {d.notes && <p className='text-xs text-muted-foreground mt-1 italic'>Notiz: {d.notes}</p>}
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
        </TabsContent>

        {/* MEDIKAMENTE TAB */}
        <TabsContent value='medications' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium'>Medikamente verwalten</h3>
            <div className='flex items-center gap-3'>
              <div className='relative w-56'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input placeholder='Medikament suchen...' value={medSearch} onChange={(e) => setMedSearch(e.target.value)} className='pl-9' />
              </div>
              <Button onClick={() => { setEditMedId(null); setMedName(''); setMedIngredient(''); setMedStrength(''); setMedForm(''); setShowMedForm(true); }}>
                <Plus className='h-4 w-4 mr-1' /> Medikament hinzufügen
              </Button>
            </div>
          </div>
          {showMedForm && (
            <Card className='border-primary'>
              <CardHeader><CardTitle className='text-base'>{editMedId ? 'Medikament bearbeiten' : 'Neues Medikament'}</CardTitle></CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid gap-3 md:grid-cols-4'>
                  <div className='space-y-1'><Label>Name *</Label><Input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder='z.B. Ibuprofen' /></div>
                  <div className='space-y-1'><Label>Wirkstoff</Label><Input value={medIngredient} onChange={(e) => setMedIngredient(e.target.value)} placeholder='z.B. Ibuprofen' /></div>
                  <div className='space-y-1'><Label>Stärke</Label><Input value={medStrength} onChange={(e) => setMedStrength(e.target.value)} placeholder='z.B. 400 mg' /></div>
                  <div className='space-y-1'><Label>Darreichungsform</Label><Input value={medForm} onChange={(e) => setMedForm(e.target.value)} placeholder='z.B. Tabletten' /></div>
                </div>
                <div className='flex gap-2 justify-end pt-2'>
                  <Button variant='outline' onClick={() => setShowMedForm(false)}>Abbrechen</Button>
                  <Button onClick={handleMedSave} disabled={!medName}>{editMedId ? 'Aktualisieren' : 'Hinzufügen'}</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {filteredMeds.length === 0 && !showMedForm && (
            <Card><CardContent className='py-8 text-center'><p className='text-muted-foreground'>Keine Medikamente gefunden.</p></CardContent></Card>
          )}
          <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
            {filteredMeds.map((m) => (
              <Card key={m.id}>
                <CardContent className='py-3 flex items-center justify-between'>
                  <div>
                    <p className='font-medium'>{m.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {m.active_ingredient && `${m.active_ingredient} `}
                      {m.strength && `- ${m.strength} `}
                      {m.form && `- ${m.form}`}
                    </p>
                  </div>
                  <div className='flex gap-1'>
                    <Button size='sm' variant='ghost' onClick={() => handleMedEdit(m)}><Pencil className='h-3.5 w-3.5' /></Button>
                    <Button size='sm' variant='ghost' onClick={() => handleMedDelete(m.id)}><Trash2 className='h-3.5 w-3.5 text-destructive' /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
      </Tabs>
    </div>
  );
}
