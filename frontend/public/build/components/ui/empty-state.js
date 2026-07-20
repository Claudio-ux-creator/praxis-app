import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
export function EmptyState({ icon = "??", title, description, actionLabel, onAction, className, }) {
    return (_jsxs("div", { className: cn("flex flex-col items-center justify-center py-8 text-center", className), children: [_jsx("span", { className: "text-3xl mb-3", children: icon }), _jsx("h3", { className: "text-sm font-medium text-foreground", children: title }), description && (_jsx("p", { className: "text-xs text-muted-foreground mt-1 max-w-[200px]", children: description })), actionLabel && onAction && (_jsx(Button, { size: "sm", variant: "outline", className: "mt-3", onClick: onAction, children: actionLabel }))] }));
}
