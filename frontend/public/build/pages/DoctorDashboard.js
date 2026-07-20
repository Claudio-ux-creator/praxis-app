import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Stethoscope, ClipboardCheck } from "lucide-react";
import { get } from "@/lib/api";
export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [pendingRx, setPendingRx] = useState([]);
    useEffect(() => {
        const stored = localStorage.getItem("doctor_info");
        if (stored) {
            const info = JSON.parse(stored);
            setDoctorInfo(info);
            get("/doctor/prescriptions?doctorId=" + info.id).then((r) => {
                if (r.success && r.data) {
                    setPendingRx(r.data.filter((p) => p.status === "PENDING"));
                }
            });
        }
        else {
            navigate("/doctor-login");
        }
    }, []);
    if (!doctorInfo)
        return null;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-semibold", children: ["Willkommen, Dr. ", doctorInfo.last_name] }), _jsx("p", { className: "text-muted-foreground", children: "Arzt-Portal" })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsx(Card, { className: "cursor-pointer transition-all hover:border-primary hover:shadow-md", onClick: () => navigate("/doctor/prescriptions"), children: _jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(ClipboardCheck, { className: "h-4 w-4" }), "Rezept-Freigabe"] }), _jsx(CardDescription, { children: pendingRx.length > 0 ? (_jsxs("span", { className: "text-amber-600 font-semibold", children: [pendingRx.length, " ausstehend"] })) : "Keine ausstehenden Rezepte" })] }) }), _jsx(Card, { className: "cursor-pointer transition-all hover:border-primary hover:shadow-md", onClick: () => navigate("/doctor/absences"), children: _jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(CalendarDays, { className: "h-4 w-4" }), "Urlaub & Abwesenheit"] }), _jsx(CardDescription, { children: "Abwesenheiten verwalten" })] }) }), _jsx(Card, { className: "cursor-pointer transition-all hover:border-primary hover:shadow-md", onClick: () => navigate("/doctor/master-data"), children: _jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [_jsx(Stethoscope, { className: "h-4 w-4" }), "Stammdaten"] }), _jsx(CardDescription, { children: "Diagnosen & Medikamente bearbeiten" })] }) })] })] }));
}
