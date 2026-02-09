# Always write parts into a known safe folder inside the repo root
$repoRoot = (git rev-parse --show-toplevel).Trim()
$outDir = Join-Path $repoRoot "dump_parts"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

# Read dump using .NET (works on older PowerShell)
$dumpPath = Join-Path $repoRoot "repo_dump.txt"
$content = [System.IO.File]::ReadAllText($dumpPath, [System.Text.Encoding]::UTF8)

$chunkSize = 1500000   # ~1.5M chars per part (safe)
$part = 1

for ($i = 0; $i -lt $content.Length; $i += $chunkSize) {
  $len = [Math]::Min($chunkSize, $content.Length - $i)
  $chunk = $content.Substring($i, $len)

  $fileName = ("repo_dump_part_{0:D2}.txt" -f $part)
  $filePath = Join-Path $outDir $fileName

  [System.IO.File]::WriteAllText($filePath, $chunk, [System.Text.Encoding]::UTF8)
  $part++
}

Write-Host "DONE! Parts created in: $outDir"
Write-Host ("Total parts: {0}" -f ($part-1))

-----------------------------
# ==============================
# Repo Dump: Path + Content Only
# Excludes: hidden folders + node_modules
# ==============================

$repoRoot = Get-Location
$outFile  = Join-Path $repoRoot "repo_dump.txt"

# Delete old dump if it exists
if (Test-Path $outFile) { Remove-Item $outFile -Force }

# Helper: returns $true if any folder segment in the path starts with "."
function HasHiddenSegment($fullPath, $rootPath) {
    $relative = $fullPath.Substring($rootPath.Length).TrimStart('\','/')
    $segments = $relative -split '[\\/]+'
    return ($segments | Where-Object { $_ -like ".*" }).Count -gt 0
}

# Collect files:
# - exclude node_modules anywhere
# - exclude any path containing a hidden folder segment (".git", ".next", ".vscode", etc.)
$files = Get-ChildItem -Path $repoRoot -Recurse -File |
    Where-Object {
        $_.FullName -notmatch '[\\/]+node_modules[\\/]+'
    } |
    Where-Object {
        -not (HasHiddenSegment $_.FullName $repoRoot.Path)
    } |
    Sort-Object FullName

foreach ($f in $files) {
    $relativePath = $f.FullName.Substring($repoRoot.Path.Length).TrimStart('\','/')

    # Write ONLY: file path + content (no extra metadata)
    "===== FILE: $relativePath =====" | Out-File -FilePath $outFile -Encoding UTF8 -Append

    try {
        Get-Content -LiteralPath $f.FullName -Raw -ErrorAction Stop |
            Out-File -FilePath $outFile -Encoding UTF8 -Append
    }
    catch {
        # If file can't be read as text (binary/locked), write a minimal marker
        "[SKIPPED: Could not read as text] $($_.Exception.Message)" |
            Out-File -FilePath $outFile -Encoding UTF8 -Append
    }

    "" | Out-File -FilePath $outFile -Encoding UTF8 -Append  # blank line between files
}

Write-Host "✅ DONE: $outFile"
Write-Host ("Files dumped: {0}" -f $files.Count)
Write-Host ("Dump size (MB): {0:N2}" -f ((Get-Item $outFile).Length / 1MB))
