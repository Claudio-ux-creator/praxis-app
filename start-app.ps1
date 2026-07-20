<#
.SYNOPSIS
    Startet Backend und Frontend mit Auto-Restart bei Abstürzen
.NOTES
    Drücke Strg+C in diesem Fenster zum Beenden aller Dienste.
#>

$ErrorActionPreference = "Continue"
$rootDir = "C:\Uni\8. Semester\Smart Applications\App"
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$logDir = Join-Path $rootDir "logs"

# Log-Verzeichnis
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host @"

  ╔═══════════════════════════════════════════════╗
  ║       PRAXIS-TERMINVERWALTUNG - START         ║
  ╚═══════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ==================== HELPER ====================

function Write-Log($msg, $color = "Gray") {
    $ts = Get-Date -Format "HH:mm:ss"
    Write-Host "[$ts] $msg" -ForegroundColor $color
}

function Wait-For-Url($url, $maxSec = 15) {
    for ($i = 0; $i -lt $maxSec; $i++) {
        Start-Sleep -Milliseconds 800
        try {
            $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($r.StatusCode -eq 200) { return $true }
        } catch {}
    }
    return $false
}

function Start-Process-Safe($name, $file, $args, $dir, $logPrefix) {
    $logFile = Join-Path $logDir "$logPrefix.log"
    $errFile = Join-Path $logDir "$logPrefix.err"
    $p = Start-Process -FilePath $file -ArgumentList $args -WorkingDirectory $dir -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput $logFile -RedirectStandardError $errFile
    return @{ Process = $p; LogFile = $logFile; ErrFile = $errFile; Name = $name }
}

function Watch-Process($svc) {
    $pid = $svc.Process.Id
    $name = $svc.Name
    while ($true) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if (-not $proc) {
            Write-Log "$name ABGESTÜRZT (PID $pid)" "Red"
            if (Test-Path $svc.ErrFile) {
                $errs = Get-Content $svc.ErrFile -Tail 3 -ErrorAction SilentlyContinue
                foreach ($e in $errs) { if ($e) { Write-Log "  $e" "DarkRed" } }
            }
            Write-Log "Starte $name neu..." "Yellow"
            return $false
        }
        Start-Sleep -Seconds 2
    }
}

# ==================== ALLE ALTEN PROZESSE BEENDEN ====================

Write-Log "Beende alte Node-Prozesse..." "Yellow"
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Log "Alte Prozesse beendet" "Green"

# ==================== BACKEND STARTEN ====================

Write-Log "Starte Backend..." "Yellow"
$backend = Start-Process-Safe "Backend" "node" @("--experimental-strip-types", "src/index.ts") $backendDir "backend"

if (Wait-For-Url "http://localhost:3000/api/health" 20) {
    Write-Log "Backend OK (PID: $($backend.Process.Id)) - http://localhost:3000" "Green"
} else {
    Write-Log "Backend NICHT gestartet! Logs:" "Red"
    Get-Content $backend.ErrFile -Tail 5 -ErrorAction SilentlyContinue | ForEach-Object { Write-Log "  $_" "DarkRed" }
}

# ==================== FRONTEND STARTEN ====================

Write-Log "Starte Frontend..." "Yellow"
$frontend = Start-Process-Safe "Frontend" "node" @("node_modules/vite/bin/vite.js", "--host") $frontendDir "frontend"

if (Wait-For-Url "http://localhost:5173" 25) {
    Write-Log "Frontend OK (PID: $($frontend.Process.Id)) - http://localhost:5173" "Green"
} else {
    Write-Log "Frontend NICHT gestartet! Logs:" "Red"
    Get-Content $frontend.ErrFile -Tail 5 -ErrorAction SilentlyContinue | ForEach-Object { Write-Log "  $_" "DarkRed" }
}

Write-Host @"

  ╔═══════════════════════════════════════════════╗
  ║     ✅  APP LÄUFT UNTER http://localhost:5173  ║
  ║     🔄  Auto-Restart ist aktiv                ║
  ║     📝  Logs: $logDir        ║
  ║     ⛔  Strg+C = Alle Dienste beenden         ║
  ╚═══════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ==================== WATCHDOG-LOOP ====================

while ($true) {
    $bOk = (Get-Process -Id $backend.Process.Id -ErrorAction SilentlyContinue) -ne $null
    $fOk = (Get-Process -Id $frontend.Process.Id -ErrorAction SilentlyContinue) -ne $null
    
    if (-not $bOk) {
        Write-Log "Backend neu starten..." "Yellow"
        $backend = Start-Process-Safe "Backend" "node" @("--experimental-strip-types", "src/index.ts") $backendDir "backend"
        if (Wait-For-Url "http://localhost:3000/api/health" 15) {
            Write-Log "Backend OK (PID: $($backend.Process.Id))" "Green"
        }
    }
    
    if (-not $fOk) {
        Write-Log "Frontend neu starten..." "Yellow"
        $frontend = Start-Process-Safe "Frontend" "node" @("node_modules/vite/bin/vite.js", "--host") $frontendDir "frontend"
        if (Wait-For-Url "http://localhost:5173" 20) {
            Write-Log "Frontend OK (PID: $($frontend.Process.Id))" "Green"
        }
    }
    
    Start-Sleep -Seconds 5
}
