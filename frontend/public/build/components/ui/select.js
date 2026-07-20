import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
function Select({ className, value, onValueChange, placeholder, children, ...props }) {
    return (_jsxs("div", { className: cn("relative", className), children: [_jsxs("select", { "data-slot": "select", value: value, onChange: (e) => onValueChange?.(e.target.value), className: cn("h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1 pr-8 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80", !value && "text-muted-foreground"), ...props, children: [placeholder && (_jsx("option", { value: "", disabled: true, children: placeholder })), children] }), _jsx(ChevronDownIcon, { className: "pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" })] }));
}
export { Select };
