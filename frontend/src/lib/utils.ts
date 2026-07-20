import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  // Wenn es bereits DD.MM.YYYY oder ähnlich ist, direkt zurück
  if (dateStr.includes('.')) return dateStr;
  // ISO-Datum (YYYY-MM-DD) umwandeln
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }
  return dateStr;
}
