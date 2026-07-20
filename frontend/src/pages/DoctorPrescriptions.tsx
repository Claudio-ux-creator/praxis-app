import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Pill, Calendar, CheckCircle, XCircle, Search } from "lucide-react";
import { get, post, patch } from "@/lib/api";
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
  date_of_birth: string;
  phone: string;
  doctor_first_name: string;
  doctor_last_name: string;
  last_consultation: string | null;
}

interface DoctorInfo {
  id: number;
  first_name: string;
  last_name: string;
}

const STATUS_MAP: Record<string, string> = {

  PENDING: "Ausstehend",
  IN_PROGRESS: "In Prüfung",
  APPROVED: "Freigegeben",
  REJECTED: "Abgelehnt",
  COLLECTED: "Abgeholt",
};

const STATUS_BADGE: Record<string, string> = {

  PENDING: "secondary",
  IN_PROGRESS: "default",
  APPROVED: "default",
  REJECTED: "destructive",
  COLLECTED: "outline",
};

export default function DoctorPrescriptions() {
  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filter, setFilter] = useState<string>("IN_PROGRESS");
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // New prescription form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newInsurance, setNewInsurance] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("doctor_info");
    if (stored) {
      setDoctorInfo(JSON.parse(stored));
    } else {
      navigate("/doctor-login");
    }
  }, []);

  const loadPrescriptions = () => {
    setLoading(true);
    get<Prescription[]>("/doctor/prescriptions").then((r) => {
      if (r.success && r.data) setPrescriptions(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (doctorInfo) loadPrescriptions();
  }, [doctorInfo]);

  const handleApprove = async (id: number) => {
    await patch("/doctor/prescriptions/" + id + "/approve", { status: "APPROVED" });
    loadPrescriptions();
  };

  const handleReject = async (id: number) => {
    await patch("/doctor/prescriptions/" + id + "/approve", { status: "REJECTED", rejectReason });
    setRejectModal(null);
    setRejectReason("");
    loadPrescriptions();
  };

  const handleCreate = async () => {
    if (!newInsurance || !newMedication || !doctorInfo) return;
    const r = await post("/doctor/prescriptions", {
      insuranceNumber: newInsurance,
      medicationName: newMedication,
      dosage: newDosage,
      notes: newNotes,
      doctorId: doctorInfo.id,
    });
    if (r.success) {
      setShowNewForm(false);
      setNewInsurance("");
      setNewMedication("");
      setNewDosage("");
      setNewNotes("");
      loadPrescriptions();
    }
  };

  const filtered = filter === "ALL" ? prescriptions : prescriptions.filter((p) => p.status === filter);
  const counts: Record<string, number> = {};
  for (const p of prescriptions) counts[p.status] = (counts[p.status] || 0) + 1;
  counts["ALL"] = prescriptions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Rezept-Freigabe</h1>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "COLLECTED"].map((s) => {
            if (!counts[s] && s !== "ALL") return null;
            return (
              <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="text-xs">
                {s === "ALL" ? "Alle" : STATUS_MAP[s]}
                <span className="ml-1.5 opacity-70">({counts[s] || 0})</span>
              </Button>
            );
          })}
          <Button size="sm" variant="outline" className="ml-2" onClick={() => setShowNewForm(!showNewForm)}>
            + Neues Rezept
          </Button>
        </div>
      </div>

      {/* New Prescription Form */}
      {showNewForm && (
        <Card className="border-primary">
          <CardHeader><CardTitle className="text-base">Neues Rezept ausstellen</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Versichertennummer</Label>
                <Input value={newInsurance} onChange={(e) => setNewInsurance(e.target.value)} placeholder="z. B. A123456789" />
              </div>
              <div className="space-y-1">
                <Label>Medikament</Label>
                <Input value={newMedication} onChange={(e) => setNewMedication(e.target.value)} placeholder="Medikamentname" />
              </div>
              <div className="space-y-1">
                <Label>Dosierung</Label>
                <Input value={newDosage} onChange={(e) => setNewDosage(e.target.value)} placeholder="z. B. 500 mg" />
              </div>
              <div className="space-y-1">
                <Label>Notizen</Label>
                <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewForm(false)}>Abbrechen</Button>
              <Button onClick={handleCreate}>Rezept ausstellen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Lade Rezepte...</p>}

      <div className="space-y-3">
        {filtered.map((p) => (
          <Card key={p.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{p.patient_last_name}, {p.patient_first_name}</span>
                    <span className="text-xs text-muted-foreground">({p.insurance_number})</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Pill className="h-3.5 w-3.5" />
                      {p.medication_name}
                      {p.dosage && <span className="ml-1">({p.dosage})</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {p.request_date}
                    </span>
                  </div>
                  {p.notes && <p className="text-xs text-muted-foreground mt-1">Notiz: {p.notes}</p>}
                  {p.last_consultation && (
                    (() => {
                      const lastConsult = new Date(p.last_consultation);
                      const oneYearAgo = new Date();
                      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                      const isOld = lastConsult < oneYearAgo;
                      return (
                        <p className="text-xs mt-1">
                          Letzte Konsultation: {p.last_consultation}
                          {isOld ? ' ⚠️ > 1 Jahr her – Freigabe nicht möglich' : ' ✅ < 1 Jahr'}</p>
                      );
                    })()
                  )}
                  {!p.last_consultation && (
                    <p className="text-xs mt-1 text-destructive font-semibold">Keine Konsultation bekannt – Freigabe nicht möglich</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {p.status === "PENDING" && (
                    <>
                      <Button size="sm" variant="default" onClick={() => handleApprove(p.id)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Freigeben
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setRejectModal(p.id)}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Ablehnen
                      </Button>
                    </>
                  )}
                  <Badge variant={(STATUS_BADGE[p.status] || "outline") as any}>
                    {STATUS_MAP[p.status] || p.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader><CardTitle>Rezept ablehnen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Grund der Ablehnung</Label>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Bitte Grund angeben..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRejectModal(null)}>Abbrechen</Button>
                <Button variant="destructive" onClick={() => handleReject(rejectModal)}>Ablehnen</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}




