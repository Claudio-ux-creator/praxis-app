import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LandingPage() {
  const navigate = useNavigate();
  const [insuranceNumber, setInsuranceNumber] = useState("A123456789");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/patients/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insuranceNumber, dateOfBirth: dateOfBirth || undefined }),
      }).then((r) => r.json());
      if (res.success && res.data) {
        localStorage.setItem("patient_insurance", insuranceNumber);
        localStorage.setItem("patient_name", res.data.first_name + " " + res.data.last_name);
        navigate("/patient");
      } else {
        setError(res.error || "Patient nicht gefunden");
      }
    } catch {
      setError("Verbindungsfehler");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Praxis Demir &amp; Kollegen</CardTitle>
          <CardDescription>Online-Terminverwaltung</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceNumber">Versichertennummer</Label>
              <Input
                id="insuranceNumber"
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value)}
                placeholder="z. B. A123456789"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Geburtsdatum (optional)</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Nur erforderlich bei mehreren Patienten mit gleicher Versichertennummer.</p>
            </div>
            {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird geprüft..." : "Anmelden"}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
            <p>Testzugang: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">A123456789</code></p>
            <p><a href="/mfa" className="text-primary underline">MFA-Login</a></p>
            <p><a href="/doctor-login" className="text-primary underline">Arzt-Login</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}