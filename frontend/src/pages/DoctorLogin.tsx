import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { post } from "@/lib/api";

interface DoctorInfo {
  id: number;
  first_name: string;
  last_name: string;
  color: string | null;
}

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("doctor_info");
    if (stored) {
      navigate("/doctor");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await post<DoctorInfo>("/doctor/login", { firstName, lastName });
      if (r.success && r.data) {
        localStorage.setItem("doctor_info", JSON.stringify(r.data));
        navigate("/doctor");
      } else {
        setError(r.error || "Arzt nicht gefunden");
      }
    } catch {
      setError("Verbindungsfehler");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Arzt-Login</CardTitle>
          <CardDescription>Bitte melden Sie sich mit Ihrem Namen an</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Vorname</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="z. B. Ahmet" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nachname</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="z. B. Demir" required />
            </div>
            {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Wird geprüft..." : "Anmelden"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Testzugang: <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">Ahmet Demir</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}