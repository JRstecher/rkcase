# Optionnel : meme role que dev.cmd. Si une erreur "scripts desactives" apparait,
# utilisez dev.cmd ou depuis-powershell.cmd (fichiers .cmd, pas PowerShell).
$ErrorActionPreference = "Stop"
$roots = @(
    "${env:ProgramFiles}\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "${env:LOCALAPPDATA}\Programs\node"
)
$nodeDir = $null
foreach ($r in $roots) {
    if (Test-Path "$r\node.exe") {
        $nodeDir = $r
        break
    }
}
if (-not $nodeDir) {
    Write-Host "[casebs] Node.js introuvable. https://nodejs.org" -ForegroundColor Red
    exit 1
}
$env:Path = "$nodeDir;$env:Path"
Set-Location $PSScriptRoot
Write-Host "[casebs] Node : $nodeDir" -ForegroundColor Green
& npm run dev
