$frontendDir = "C:\Uni\8. Semester\Smart Applications\App\frontend"
$logFile = Join-Path $frontendDir "vite.log"

Write-Host "=== Frontend-Startscript (Auto-Restart) ===" -ForegroundColor Cyan
Write-Host "Log: $logFile"
Write-Host "Druecke Strg+C zum Beenden`n"

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Starte Frontend..." -ForegroundColor Yellow
    
    $p = Start-Process -FilePath "node" -ArgumentList "node_modules/vite/bin/vite.js", "--host" `
        -WorkingDirectory $frontendDir `
        -WindowStyle Hidden `
        -PassThru `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError "$logFile.err"
    
    $pid = $p.Id
    
    # Warte bis es läuft
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($r.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch {}
        
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if (-not $proc) { break }
    }
    
    if ($ready) {
        Write-Host "[$timestamp] Frontend OK (PID: $pid)" -ForegroundColor Green
    } else {
        Write-Host "[$timestamp] Frontend NICHT gestartet!" -ForegroundColor Red
        Get-Content "$logFile.err" -Tail 5 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    }
    
    while ($true) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if (-not $proc) { break }
        Start-Sleep -Seconds 3
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Frontend abgestuerzt! Neustart in 2 Sekunden..." -ForegroundColor Red
    Start-Sleep -Seconds 2
}
