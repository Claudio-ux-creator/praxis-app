$backupDir = "C:\Uni\8. Semester\Smart Applications\App\backend"
$logFile = Join-Path $backupDir "server.log"

Write-Host "=== Backend-Startscript (Auto-Restart) ===" -ForegroundColor Cyan
Write-Host "Log: $logFile"
Write-Host "Druecke Strg+C zum Beenden`n"

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Starte Backend..." -ForegroundColor Yellow
    
    $p = Start-Process -FilePath "node" -ArgumentList "--experimental-strip-types", "src/index.ts" `
        -WorkingDirectory $backupDir `
        -WindowStyle Hidden `
        -PassThru `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError "$logFile.err"
    
    $pid = $p.Id
    
    # Warte bis der Server hochgefahren ist
    $ready = $false
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($r.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch {}
        
        # Prüfe ob Prozess noch läuft
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if (-not $proc) {
            Write-Host "[$timestamp] Backend fruhzeitig beendet!" -ForegroundColor Red
            break
        }
    }
    
    if ($ready) {
        Write-Host "[$timestamp] Backend OK (PID: $pid)" -ForegroundColor Green
    } else {
        Write-Host "[$timestamp] Backend NICHT gestartet!" -ForegroundColor Red
        # Logs anzeigen
        if (Test-Path "$logFile.err") {
            Write-Host "Letzte Fehler:" -ForegroundColor Red
            Get-Content "$logFile.err" -Tail 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        }
    }
    
    # Warte auf den Prozess + zeige Logs live
    while ($true) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if (-not $proc) { break }
        
        # Zeige neue Log-Zeilen
        if (Test-Path $logFile) {
            Get-Content $logFile -Tail 1 | ForEach-Object {
                if ($_) { Write-Host $_ -ForegroundColor Gray }
            }
        }
        Start-Sleep -Seconds 2
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Backend abgestuerzt! Neustart in 2 Sekunden..." -ForegroundColor Red
    
    # Logs anzeigen
    if (Test-Path "$logFile.err") {
        Write-Host "Fehler-Log:" -ForegroundColor Red
        Get-Content "$logFile.err" -Tail 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    }
    
    Start-Sleep -Seconds 2
}
