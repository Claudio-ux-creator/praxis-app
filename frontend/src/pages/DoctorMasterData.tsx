import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Search, Stethoscope, Pill, FileText, Clock, XCircle, CheckCircle } from "lucide-react";
import { get, post, put, patch, del } from "@/lib/api";
import { formatDate } from "@/lib/utils";

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
export default function DoctorMasterData() {
  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [diagSearch, setDiagSearch] = useState("");

  // Medication form
  const [showMedForm, setShowMedForm] = useState(false);
  const [editMedId, setEditMedId] = useState<number | null>(null);
  const [medName, setMedName] = useState("");
  const [medIngredient, setMedIngredient] = useState("");
  const [medStrength, setMedStrength] = useState("");
  const [medForm, setMedForm] = useState("");

  // Diagnosis form
  const [showDiagForm, setShowDiagForm] = useState(false);
  const [diagInsurance, setDiagInsurance] = useState("");
  const [diagIcd, setDiagIcd] = useState("");
  const [diagText, setDiagText] = useState("");
  const [diagDate, setDiagDate] = useState("");
  const [diagNotes, setDiagNotes] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("doctor_info");
    if (!stored) { navigate("/doctor-login"); return; }
    setDoctorInfo(JSON.parse(stored));
    loadMedications();
    loadDiagnoses();
  }, []);


  // Availability state
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [newSlotWeekday, setNewSlotWeekday] = useState(1);
  const [newSlotStart, setNewSlotStart] = useState('08:00');
  const [newSlotEnd, setNewSlotEnd] = useState('12:00');

  const loadSlots = () => {
    if (!doctorInfo) return;
    setLoadingSlots(true);
    get<AvailabilitySlot[]>('/doctor/availability?doctorId=' + doctorInfo.id).then((r) => {
      if (r.success && r.data) setSlots(r.data);
      setLoadingSlots(false);
    });
  };

  useEffect(() => { if (doctorInfo) loadSlots(); }, [doctorInfo]);

  const handleAddSlot = () => {
    setNewSlotWeekday(1);
    setNewSlotStart('08:00');
    setNewSlotEnd('12:00');
    setShowSlotForm(true);
  };

  const handleSlotSave = async () => {
    if (!doctorInfo) return;
    const r = await post('/doctor/availability', {
      doctorId: doctorInfo.id,
      weekday: newSlotWeekday,
      startTime: newSlotStart,
      endTime: newSlotEnd
    });
    if (r.success) {
      setShowSlotForm(false);
      loadSlots();
    }
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
    get<Medication[]>("/doctor/medications").then((r) => {
      if (r.success && r.data) setMedications(r.data);
    });
  };

  const loadDiagnoses = () => {
    get<Diagnosis[]>("/doctor/diagnoses").then((r) => {
      if (r.success && r.data) setDiagnoses(r.data);
    });
  };

  const handleMedSave = async () => {
    if (!medName) return;
    if (editMedId) {
      await patch("/doctor/medications/" + editMedId, { name: medName, activeIngredient: medIngredient, strength: medStrength, form: medForm });
    } else {
      await post("/doctor/medications", { name: medName, activeIngredient: medIngredient, strength: medStrength, form: medForm });
    }
    resetMedForm();
    loadMedications();
  };

  const handleMedEdit = (m: Medication) => {
    setEditMedId(m.id);
    setMedName(m.name);
    setMedIngredient(m.active_ingredient || "");
    setMedStrength(m.strength || "");
    setMedForm(m.form || "");
    setShowMedForm(true);
  };

  const handleMedDelete = async (id: number) => {
    await del("/doctor/medications/" + id);
    loadMedications();
  };

  const resetMedForm = () => {
    setShowMedForm(false);
    setEditMedId(null);
    setMedName("");
    setMedIngredient("");
    setMedStrength("");
    setMedForm("");
  };

  const handleDiagSave = async () => {
    if (!diagInsurance || !diagIcd || !diagText || !doctorInfo) return;
    const r = await post("/doctor/diagnoses", {
      insuranceNumber: diagInsurance,
      icdCode: diagIcd,
      diagnosisText: diagText,
      diagnosisDate: diagDate || undefined,
      notes: diagNotes || undefined,
      doctorId: doctorInfo.id,
    });
    if (r.success) {
      setShowDiagForm(false);
      setDiagInsurance("");
      setDiagIcd("");
      setDiagText("");
      setDiagDate("");
      setDiagNotes("");
      loadDiagnoses();
    }
  };

  const filteredMeds = medications.filter((m) =>
    m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
    (m.active_ingredient && m.active_ingredient.toLowerCase().includes(medSearch.toLowerCase()))
  );

  const filteredDiagnoses = diagnoses.filter((d) =>
    d.icd_code.toLowerCase().includes(diagSearch.toLowerCase()) ||
    d.diagnosis_text.toLowerCase().includes(diagSearch.toLowerCase()) ||
    d.patient_last_name.toLowerCase().includes(diagSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Stammdaten</h1>

      <Tabs defaultValue="medications">
        <TabsList>
          <TabsTrigger value="medications"><Pill className="h-4 w-4 mr-1" /> Medikamente</TabsTrigger>
          <TabsTrigger value="diagnoses"><Stethoscope className="h-4 w-4 mr-1" /> Diagnosen</TabsTrigger>
          <TabsTrigger value="availability"><Clock className="h-4 w-4 mr-1" /> Sprechzeiten</TabsTrigger>
        </TabsList>

        {/* Medications Tab */}
        <TabsContent value="medications" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Medikament suchen..." value={medSearch} onChange={(e) => setMedSearch(e.target.value)} />
            </div>
            <Button onClick={() => { resetMedForm(); setShowMedForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Medikament hinzufügen
            </Button>
          </div>

          {showMedForm && (
            <Card className="border-primary">
              <CardHeader><CardTitle>{editMedId ? "Medikament bearbeiten" : "Neues Medikament"}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1"><Label>Name *</Label><Input value={medName} onChange={(e) => setMedName(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Wirkstoff</Label><Input value={medIngredient} onChange={(e) => setMedIngredient(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Stärke</Label><Input value={medStrength} onChange={(e) => setMedStrength(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Form</Label><Input value={medForm} onChange={(e) => setMedForm(e.target.value)} /></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetMedForm}>Abbrechen</Button>
                  <Button onClick={handleMedSave}>Speichern</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-2 md:grid-cols-2">
            {filteredMeds.map((m) => (
              <Card key={m.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.active_ingredient && `${m.active_ingredient}`}
                      {m.strength && ` â€“ ${m.strength}`}
                      {m.form && ` â€“ ${m.form}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleMedEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleMedDelete(m.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Diagnoses Tab */}
        <TabsContent value="diagnoses" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Diagnose suchen..." value={diagSearch} onChange={(e) => setDiagSearch(e.target.value)} />
            </div>
            <Button onClick={() => setShowDiagForm(!showDiagForm)}>
              <Plus className="h-4 w-4 mr-1" /> Diagnose hinzufügen
            </Button>
          </div>

          {showDiagForm && (
            <Card className="border-primary">
              <CardHeader><CardTitle className="text-base">Neue Diagnose</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1"><Label>Versichertennummer *</Label><Input value={diagInsurance} onChange={(e) => setDiagInsurance(e.target.value)} placeholder="A123456789" /></div>
                  <div className="space-y-1"><Label>ICD-Code *</Label><Input value={diagIcd} onChange={(e) => setDiagIcd(e.target.value)} placeholder="z. B. J06.9" /></div>
                  <div className="space-y-1"><Label>Diagnosetext *</Label><Input value={diagText} onChange={(e) => setDiagText(e.target.value)} placeholder="Diagnosebeschreibung" /></div>
                  <div className="space-y-1"><Label>Datum</Label><Input type="date" value={diagDate} onChange={(e) => setDiagDate(e.target.value)} /></div>
                </div>
                <div className="space-y-1"><Label>Notizen</Label><Textarea value={diagNotes} onChange={(e) => setDiagNotes(e.target.value)} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDiagForm(false)}>Abbrechen</Button>
                  <Button onClick={handleDiagSave}>Speichern</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {filteredDiagnoses.map((d) => (
              <Card key={d.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{d.icd_code}</Badge>
                        <span className="font-medium">{d.diagnosis_text}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Patient: {d.patient_last_name}, {d.patient_first_name} ({d.insurance_number}) â€“ {d.diagnosis_date}
                      </p>
                      {d.notes && <p className="text-xs text-muted-foreground">Notiz: {d.notes}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Sprechzeiten verwalten</h3>
            <Button onClick={handleAddSlot}>
              <Plus className="h-4 w-4 mr-1" /> Zeitfenster hinzufügen
            </Button>
          </div>

          {showSlotForm && (
            <Card className="border-primary">
              <CardHeader><CardTitle className="text-base">Neues Zeitfenster</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1">
                    <Label>Wochentag *</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newSlotWeekday} onChange={(e) => setNewSlotWeekday(Number(e.target.value))}>
                      <option value="1">Montag</option>
                      <option value="2">Dienstag</option>
                      <option value="3">Mittwoch</option>
                      <option value="4">Donnerstag</option>
                      <option value="5">Freitag</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Startzeit *</Label>
                    <Input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Endzeit *</Label>
                    <Input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>&nbsp;</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowSlotForm(false)}>Abbrechen</Button>
                      <Button onClick={handleSlotSave}>Speichern</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingSlots && <p className="text-muted-foreground">Lade Sprechzeiten...</p>}

          {!loadingSlots && slots.length === 0 && (
            <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">Keine Sprechzeiten eingetragen. Bitte fügen Sie Zeitfenster hinzu.</p></CardContent></Card>
          )}

          {[1,2,3,4,5].map((day) => {
            const daySlots = slots.filter((s) => s.weekday === day);
            if (daySlots.length === 0) return null;
            const dayNames = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
            return (
              <div key={day} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{dayNames[day-1]}</h4>
                {daySlots.map((slot) => (
                  <Card key={slot.id}>
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                        {slot.is_active === 0 && <Badge variant="outline">Inaktiv</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleToggleSlot(slot.id, slot.is_active)}>
                          {slot.is_active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteSlot(slot.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
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







