import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { get, patch } from "@/lib/api";

export default function PatientSettings() {
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState("");
  const [email, setEmail] = useState("");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadSettings = async (id: number) => {
    const res = await get<{ id: number; email: string; email_opt_in: number; phone: string }>("/patients/" + id + "/reminder-settings");
    if (res.success && res.data) {
      setEmail(res.data.email || "");
      setEmailOptIn(res.data.email_opt_in === 1);
      setPhone(res.data.phone || "");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/patients/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insuranceNumber, dateOfBirth: dateOfBirth || undefined }),
    }).then((r) => r.json());
    setLoading(false);
    if (res.success && res.data) {
      setPatientId(res.data.id);
      setPatientName(res.data.first_name + " " + res.data.last_name);
      setLoggedIn(true);
      loadSettings(res.data.id);
    } else {
      setError(res.error || "Patient nicht gefunden");
    }
  };

  const handleSave = async () => {
    if (!patientId) return;
    setError("");
    setSuccessMsg("");
    setSaving(true);
    const res = await patch("/patients/" + patientId + "/reminder-settings", { email, emailOptIn });
    setSaving(false);
    if (res.success) {
      setSuccessMsg("Einstellungen gespeichert");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setError(res.error || "Fehler beim Speichern");
    }
  };

  if (!loggedIn) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Patienten-Login</CardTitle>
            <CardDescription>Geben Sie Ihre Versichertennummer ein, um Ihre Einstellungen zu verwalten.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="insurance">Versichertennummer</Label>
                <Input id="insurance" value={insuranceNumber} onChange={(e) => setInsuranceNumber(e.target.value)} placeholder="z. B. A123456789" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Geburtsdatum (optional)</Label>
                <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Wird geladen..." : "Weiter"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <Badge variant="outline" className="text-sm">{patientName}</Badge>
      </div>

      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {successMsg && <div className="rounded-lg border border-green-500/50 bg-green-50 p-3 text-sm text-green-700">{successMsg}</div>}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Benachrichtigungen & Kontakt</CardTitle>
          <CardDescription>Verwalten Sie Ihre Kontaktdaten und entscheiden Sie, ob Sie Erinnerungen erhalten moechten.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="max@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer</Label>
            <Input id="phone" type="tel" value={phone} disabled />
            <p className="text-xs text-muted-foreground">Die Telefonnummer kann nur in der Praxis geaendert werden.</p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex-1">
              <div className="text-sm font-medium">E-Mail-Erinnerungen</div>
              <div className="text-xs text-muted-foreground">Sie erhalten 24 Stunden vor Ihrem Termin eine Erinnerung per E-Mail.</div>
            </div>
            <Button size="sm" variant={emailOptIn ? "default" : "outline"} onClick={() => setEmailOptIn(!emailOptIn)} disabled={!email}>
              {emailOptIn ? "Aktiviert" : "Deaktiviert"}
            </Button>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Wird gespeichert..." : "Einstellungen speichern"}
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Informationen zu Erinnerungen</CardTitle>
          <CardDescription>Wie wir Sie benachrichtigen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">??</span>
            <div>
              <span className="font-medium">24h-Erinnerung</span>
              <p className="text-xs text-muted-foreground">Am Vortag Ihres Termins erhalten Sie eine E-Mail mit Datum, Uhrzeit und Arzt.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5">?</span>
            <div>
              <span className="font-medium">Keine Speicherung</span>
              <p className="text-xs text-muted-foreground">Ihre Daten werden nur zur Terminverwaltung genutzt und nicht an Dritte weitergegeben.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5">??</span>
            <div>
              <span className="font-medium">DSGVO-konform</span>
              <p className="text-xs text-muted-foreground">Sie koennen Ihre Einwilligung jederzeit widerrufen.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}