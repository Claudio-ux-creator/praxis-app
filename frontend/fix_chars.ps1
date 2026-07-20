$f = "C:\Uni\8. Semester\Smart Applications\App\frontend\src\pages\MFAPrescriptions.tsx"
$bytes = [System.IO.File]::ReadAllBytes($f)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# Find all non-ASCII chars
for ($i = 0; $i -lt $text.Length; $i++) {
    $c = $text[$i]
    if ($c -gt 127) {
        $start = [Math]::Max(0, $i - 5)
        $end = [Math]::Min($text.Length, $i + 10)
        Write-Host "Char at $i: code=$([int]$c) context='$($text.Substring($start, $end-$start))'"
        break
    }
}
