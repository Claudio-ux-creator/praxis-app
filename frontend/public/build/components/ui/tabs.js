import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
const TabsContext = React.createContext(null);
function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }) {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "");
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : uncontrolledValue;
    const handleValueChange = React.useCallback((newValue) => {
        if (!isControlled)
            setUncontrolledValue(newValue);
        onValueChange?.(newValue);
    }, [isControlled, onValueChange]);
    return (_jsx(TabsContext.Provider, { value: { value: currentValue, onValueChange: handleValueChange }, children: _jsx("div", { className: cn("w-full", className), children: children }) }));
}
function TabsList({ children, className }) {
    return (_jsx("div", { className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className), children: children }));
}
function TabsTrigger({ value, children, className }) {
    const ctx = React.useContext(TabsContext);
    const isActive = ctx?.value === value;
    return (_jsx("button", { type: "button", role: "tab", onClick: () => ctx?.onValueChange(value), className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", isActive ? "bg-background text-foreground shadow" : "hover:bg-background/50 hover:text-foreground", className), children: children }));
}
function TabsContent({ value, children, className }) {
    const ctx = React.useContext(TabsContext);
    if (ctx?.value !== value)
        return null;
    return (_jsx("div", { role: "tabpanel", className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className), children: children }));
}
export { Tabs, TabsList, TabsTrigger, TabsContent };
