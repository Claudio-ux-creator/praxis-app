const BASE_URL = "/api";
const MAX_RETRIES = 2; // Nach Fehler: max 2 Wiederholungen
const RETRY_DELAY_MS = 1500;
async function request(endpoint, options, retryCount = 0) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s Timeout
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            ...options,
        });
        clearTimeout(timeout);
        const json = await res.json();
        if (!res.ok) {
            return { success: false, error: json.error ?? `HTTP ${res.status}` };
        }
        return json;
    }
    catch (err) {
        // Automatischer Retry bei Netzwerkfehlern
        if (retryCount < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            return request(endpoint, options, retryCount + 1);
        }
        // Endgültiger Fehler – benutzerfreundlich aufbereiten
        const msg = err instanceof Error ? err.message : "Netzwerkfehler";
        if (msg.includes("abort") || msg.includes("timeout")) {
            return { success: false, error: "Der Server antwortet nicht. Bitte laden Sie die Seite neu (F5)." };
        }
        if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("net::ERR")) {
            return {
                success: false,
                error: "Verbindung zum Server unterbrochen. Die Anwendung wird in Kürze neu verbinden – bitte warten.",
            };
        }
        return { success: false, error: msg };
    }
}
export function get(endpoint) {
    return request(endpoint, { method: "GET" });
}
export function post(endpoint, body) {
    return request(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
    });
}
export function put(endpoint, body) {
    return request(endpoint, {
        method: "PUT",
        body: JSON.stringify(body),
    });
}
export function patch(endpoint, body) {
    return request(endpoint, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}
export function del(endpoint) {
    return request(endpoint, { method: "DELETE" });
}
