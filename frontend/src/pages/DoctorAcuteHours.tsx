import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Save, AlertCircle } from "lucide-react";
import { get, post } from "@/lib/api";

interface DoctorInfo {
  id: number;
  first_name: string;
  last_name: string;
}

export default function DoctorAcuteHours() {
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [slotInterval, setSlotInterval] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("doctor_info");
    if (stored) setDoctorInfo(JSON.parse(stored));
  }, []);

  const loadHours = () => {
    if (!doctorInfo || !date) return;
    setLoading(true);
    get("/acute-slots/doctor-hours?doctorId=" + doctorInfo.id + "&date=" + date).then((r: any) => {
      if (r.success && r.data) {
        setStartTime(r.data.start_time || "08:00");
        setEndTime(r.data.end_time || "12:00");
        setSlotInterval(r.data.slot_interval || 30);
        setIsActive(r.data.is_active ? true : false);
        setSaved(true);
      } else {
        setSaved(false);
      }
      setLoading(false);
    });
  };

  useEffect(() => { loadHours(); }, [doctorInfo, date]);

  const handleSave = async () => {
    if (!doctorInfo || !date) return;
    setSaving(true);
    const r = await post("/acute-slots/doctor-hours", {
      doctorId: doctorInfo.id,
      date,
      startTime,
      endTime,
      slotInterval,
      isActive,
    });
    if (r.success) {
      setSaved(true);
    } else {
      alert(r.error || "Fehler beim Speichern");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Akutsprechstunde</h1>
        {saved && (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <Save className="h-3 w-3" /> Gespeichert
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Akutsprechstunde f�r ein Datum festlegen
          </CardTitle>
          <CardDescription>
            Legen Sie fest, an welchen Tagen Sie Akutsprechstunde anbieten. Die MFA sieht dann nur Slots
            f�r �rzte mit aktiver Akutsprechstunde.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label>Datum *</Label>
              <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); }} />
            </div>
            <div className="space-y-1">
              <Label>Beginn *</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Ende *</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Slot-Intervall (Min.)</Label>
              <Input type="number" min="10" max="120" step="5" value={slotInterval} onChange={(e) => setSlotInterval(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Max. Slots (berechnet)</Label>
              <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/50 text-sm">
                {(() => {
                  const sp = startTime.split(":").map(Number);
                  const ep = endTime.split(":").map(Number);
                  const sm = sp[0] * 60 + sp[1];
                  const em = ep[0] * 60 + ep[1];
                  const total = em - sm;
                  const calc = total > 0 && slotInterval > 0 ? Math.floor(total / slotInterval) : 1;
                  return <span>Es werden <strong>{calc}</strong> Slots generiert</span>;
                })()}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Aktiv</Label>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
                <span className="text-sm">{isActive ? "Akutsprechstunde aktiv" : "Deaktiviert"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={!date || saving}>
              {saving ? "Wird gespeichert..." : saved ? "Aktualisieren" : "Akutsprechstunde festlegen"}
            </Button>
            {saved && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Save className="h-3 w-3" /> Einstellungen f�r {date} gespeichert
              </p>
            )}
          </div>

          {loading && <p className="text-sm text-muted-foreground">Lade Einstellungen...</p>}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="py-4 text-sm text-muted-foreground flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Die MFA sieht im Dashboard nur Akutslots f�r �rzte, die an diesem Tag eine aktive
            Akutsprechstunde eingetragen haben. Die Slots werden automatisch generiert, wenn die MFA
            das Dashboard aufruft.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}


