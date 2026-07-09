import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Praxis Demir &amp; Kollegen</CardTitle>
          <CardDescription>Online-Terminverwaltung</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceNumber">Versichertennummer</Label>
              <Input id="insuranceNumber" placeholder="z. B. A123456789" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" placeholder="Passwort" required />
            </div>
            <Button type="submit" className="w-full">Anmelden</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Praxis-Mitarbeiter? <a href="/mfa" className="text-primary underline">MFA-Login</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
