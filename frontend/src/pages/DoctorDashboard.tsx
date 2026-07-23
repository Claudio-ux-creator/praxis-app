import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Stethoscope, ClipboardCheck } from "lucide-react";
import { get } from "@/lib/api";

interface PrescriptionSummary {
  id: number;
  medication_name: string;
  status: string;
  patient_first_name: string;
  patient_last_name: string;
  request_date: string;
}

interface DoctorInfo {
  id: number;
  first_name: string;
  last_name: string;
  color: string | null;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [pendingRx, setPendingRx] = useState<PrescriptionSummary[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("doctor_info");
    if (stored) {
      const info = JSON.parse(stored) as DoctorInfo;
      setDoctorInfo(info);
      get<PrescriptionSummary[]>("/doctor/prescriptions?doctorId=" + info.id).then((r) => {
        if (r.success && r.data) {
          setPendingRx(r.data.filter((p: any) => p.status === "PENDING"));
        }
      });
    } else {
      navigate("/doctor-login");
    }
  }, []);

  if (!doctorInfo) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Willkommen, Dr. {doctorInfo.last_name}</h1>
        <p className="text-muted-foreground">Arzt-Portal</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => navigate("/doctor/prescriptions")}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Rezept-Freigabe
            </CardTitle>
            <CardDescription>
              {pendingRx.length > 0 ? (
                <span className="text-amber-600 font-semibold">{pendingRx.length} ausstehend</span>
              ) : "Keine ausstehenden Rezepte"}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => navigate("/doctor/absences")}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Urlaub & Abwesenheit
            </CardTitle>
            <CardDescription>Abwesenheiten verwalten</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={() => navigate("/doctor/master-data")}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Stammdaten
            </CardTitle>
            <CardDescription>Diagnosen & Medikamente bearbeiten</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}