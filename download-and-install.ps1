# Download and run the mkg03a3s installer.
# Update DOWNLOAD_URL with the published installer location.

$ErrorActionPreference = 'Stop'

$DOWNLOAD_URL = 'https://github.com/yourusername/mkg03a3s/releases/download/v1.0.0/mkg03a3s-setup.exe'
$OUTPUT_FILE = "$env:TEMP\mkg03a3s-setup.exe"

Write-Host "Lade mkg03a3s Installer herunter..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $OUTPUT_FILE -UseBasicParsing

Write-Host "Starte den Installer..." -ForegroundColor Green
Start-Process -FilePath $OUTPUT_FILE -Wait
