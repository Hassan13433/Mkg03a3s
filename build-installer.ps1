# Build installer for mkg03a3s on Windows.
# This script runs the Electron builder and creates the NSIS installer in the dist folder.

$ErrorActionPreference = 'Stop'

Write-Host "Starte mkg03a3s Installer-Build..." -ForegroundColor Cyan

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm wurde nicht gefunden. Bitte installiere Node.js und führe das Skript erneut aus."
    exit 1
}

Write-Host "Installiere Abhängigkeiten..." -ForegroundColor Yellow
npm install

Write-Host "Baue Installer mit electron-builder..." -ForegroundColor Yellow
npm run dist:all

Write-Host "Installer erstellt. Schau im release-Ordner und/oder downloads-Ordner nach." -ForegroundColor Green
