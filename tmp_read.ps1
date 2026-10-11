param([string]$File, [int]$Start, [int]$Count)
$lines = Get-Content $File
Write-Output ("TOTAL LINES: " + $lines.Count)
$end = [Math]::Min($Start + $Count - 1, $lines.Count)
for ($i = $Start; $i -le $end; $i++) {
  Write-Output ("{0}: {1}" -f $i, $lines[$i - 1])
}
