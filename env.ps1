# Ajoute Node au PATH pour la session. Sinon : .\dev.cmd
$roots = @(
    "${env:ProgramFiles}\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "${env:LOCALAPPDATA}\Programs\node"
)
foreach ($r in $roots) {
    if (Test-Path "$r\node.exe") {
        $env:Path = "$r;$env:Path"
        Write-Host "[casebs] PATH : $r ajoute." -ForegroundColor Green
        break
    }
}
