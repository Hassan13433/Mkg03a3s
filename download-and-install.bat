@echo off
set DOWNLOAD_URL=https://example.com/path/to/mkg03a3s-setup.exe
set OUTPUT_FILE=%TEMP%\mkg03a3s-setup.exe

echo Lade mkg03a3s Installer herunter...
powershell -NoProfile -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%OUTPUT_FILE%' -UseBasicParsing"
echo Starte den Installer...
start "" "%OUTPUT_FILE%"
