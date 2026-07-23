import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { get, post, del } from "@/lib/api";

interface Absence {
  id: number;
  type: string;
  doctor_ids: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  blocks_booking: number;
  created_at: string;
}

interface DoctorInfo {
  id: number;
  first_name: string;
  last_name: string;
}

interface DoctorOption {
  id: number;
  first_name: string;
  last_name: string;
}

export default function DoctorAbsences() {
  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("VACATION");
  const [selectedDoctors, setSelectedDoctors] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("doctor_info");
    if (stored) {
      setDoctorInfo(JSON.parse(stored));
    } else {
      navigate("/doctor-login");
    }
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      get<Absence[]>("/doctor/absences"),
      get<DoctorOption[]>("/doctors"),
    ]).then(([a, d]) => {
      if (a.success && a.data) setAbsences(a.data);
      if (d.success && d.data) setDoctors(d.data);
      setLoading(false);
    });
  };

  useEffect(() => { if (doctorInfo) loadData(); }, [doctorInfo]);

  const handleCreate = async () => {
    if (!startDate || !endDate || selectedDoctors.length === 0) return;
    const r = await post("/doctor/absences", {
      type,
      doctorIds: selectedDoctors,
      startDate,
      endDate,
      reason: reason || undefined,
      blocksBooking: true,
    });
    if (r.success) {
      setShowForm(false);
      setType("VACATION");
      setSelectedDoctors([]);
      setStartDate("");
      setEndDate("");
      setReason("");
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    const r = await del("/doctor/absences/" + id);
    if (r.success) loadData();
  };

  const toggleDoctor = (id: number) => {
    setSelectedDoctors((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const typeLabels: Record<string, string> = {
    VACATION: "Urlaub",
    SICKNESS: "Krankheit",
    TRAINING: "Fortbildung",
    OTHER: "Sonstiges",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Urlaub & Abwesenheit</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> Abwesenheit eintragen
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary">
          <CardHeader><CardTitle className="text-base">Neue Abwesenheit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Typ</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={type} onChange={(e) => setType(e.target.value)}>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Betroffene Ärzte</Label>
                <div className="flex flex-wrap gap-1">
                  {doctors.map((doc) => (
                    <Button key={doc.id} type="button" size="sm" variant={selectedDoctors.includes(doc.id) ? "default" : "outline"} onClick={() => toggleDoctor(doc.id)}>
                      Dr. {doc.last_name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Startdatum</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Enddatum</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Grund (optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Grund der Abwesenheit..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              <Button onClick={handleCreate}>Speichern</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Lade Abwesenheiten...</p>}

      <div className="space-y-3">
        {absences.length === 0 && !loading && (
          <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">Keine Abwesenheiten eingetragen.</p></CardContent></Card>
        )}
        {absences.map((a) => (
          <Card key={a.id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{a.start_date} bis {a.end_date}</span>
                  <Badge variant="secondary">{typeLabels[a.type] || a.type}</Badge>
                  {a.blocks_booking === 1 && <Badge variant="outline">Keine Buchung</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ärzte: {a.doctor_ids.split(",").map((id) => {
                    const doc = doctors.find((d) => d.id === Number(id));
                    return doc ? `Dr. ${doc.last_name}` : id;
                  }).join(", ")}
                </p>
                {a.reason && <p className="text-xs text-muted-foreground">Grund: {a.reason}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

