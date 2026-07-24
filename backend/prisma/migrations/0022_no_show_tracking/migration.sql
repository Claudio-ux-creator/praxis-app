-- No-Show-Tracking: Warnung und Sperrung bei wiederholtem Nichterscheinen
ALTER TABLE patients ADD COLUMN no_show_warning_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE patients ADD COLUMN is_blocked INTEGER NOT NULL DEFAULT 0;
