import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
export function RootLayout({ role }) {
    return (_jsxs("div", { className: "flex min-h-screen", children: [_jsx(Sidebar, { role: role }), _jsx("main", { className: "flex-1 p-6 overflow-y-auto bg-background", children: _jsx(Outlet, {}) })] }));
}
