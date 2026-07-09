import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { get, post } from "@/lib/api";

interface PendingReminder {
  id: number;
  appointment_id: number;
  patient_id: number;
  type: string;
  channel: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  appointment_date: string;
  appointment_time: string;
  category: string;
  patient_first_name: string;
  patient_last_name: string;
  phone: string;
  email: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

interface DashboardData {
  today: string;
  sentToday: number;
  pendingCount: number;
  recent: {
    id: number;
    type: string;
    channel: string;
    status: string;
    sent_at: string;
    created_at: string;
    appointment_date: string;
    appointment_time: string;
    patient_first_name: string;
    patient_last_name: string;
  }[];
}

export default function MFAReminders() {
  const [pending, setPending] = useState<PendingReminder[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [dashRes, pendRes] = await Promise.all([
      get<DashboardData>("/reminders/dashboard"),
      get<PendingReminder[]>("/reminders/pending"),
    ]);
    setLoading(false);
    if (dashRes.success && dashRes.data) setDashboard(dashRes.data);
    if (pendRes.success && pendRes.data) setPending(pendRes.data);
  };

  useEffect(() => { loadData(); }, []);

  const handleProcess = async () => {
    setProcessing(true);
    setError("");
    setStatusMsg("");
    const res = await post("/reminders/process", {});
    setProcessing(false);
    if (res.success && res.data) { var d = res.data as any;
      setStatusMsg("Erinnerungen verarbeitet: " + d.stats.generated + " generiert, " + d.stats.sent + " gesendet");
      loadData();
    } else {
      setError(res.error || "Fehler beim Verarbeiten");
    }
  };

  if (loading) {
    return <div className="space-y-6"><h1 className="text-2xl font-semibold">Erinnerungen</h1><p className="text-muted-foreground">Lade...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Erinnerungs-Zentrale</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            Heute: {dashboard?.sentToday || 0} gesendet
          </Badge>
          <Badge variant={pending.length > 0 ? "default" : "secondary"} className="text-sm">
            {pending.length} ausstehend
          </Badge>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {statusMsg && <div className="rounded-lg border border-green-500/50 bg-green-50 p-3 text-sm text-green-700">{statusMsg}</div>}

      {/* Steuerung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Erinnerungen verarbeiten</CardTitle>
          <CardDescription>Generiert 24h-Erinnerungen fuer morgige Termine und sendet alle ausstehenden Erinnerungen (Simulation).</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleProcess} disabled={processing} className="w-full sm:w-auto">
            {processing ? "Verarbeite..." : "Jetzt verarbeiten & senden"}
          </Button>
        </CardContent>
      </Card>

      {/* Ausstehende Erinnerungen */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ausstehende Erinnerungen ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <div className="font-medium">{r.patient_last_name}, {r.patient_first_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.appointment_date} um {r.appointment_time} Uhr · Dr. {r.doctor_last_name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{r.type === "24H" ? "24h" : "Same-Day"}</Badge>
                  <Badge variant={r.channel === "EMAIL" ? "default" : "secondary"} className="text-xs">{r.channel}</Badge>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700">Ausstehend</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Letzte 50 Erinnerungen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verlauf (letzte 50)</CardTitle>
          <CardDescription>Alle gesendeten und ausstehenden Erinnerungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 max-h-96 overflow-y-auto">
          {dashboard?.recent.length === 0 && (
            <p className="text-sm text-muted-foreground">Noch keine Erinnerungen.</p>
          )}
          {dashboard?.recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-medium">{r.patient_last_name}, {r.patient_first_name}</span>
                <span className="text-muted-foreground">{r.appointment_date} {r.appointment_time}</span>
                <span className="text-muted-foreground">{r.channel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {r.type === "24H" ? "24h" : "Today"}
                </Badge>
                <Badge className={"text-[10px] px-1 py-0 " + (r.status === "SENT" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                  {r.status === "SENT" ? "Gesendet" : "Ausstehend"}
                </Badge>
                {r.sent_at && <span className="text-muted-foreground">{r.sent_at}</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}