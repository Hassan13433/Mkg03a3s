@echo off
cd /d "%~dp0"
if exist node_modules\.bin\electron.cmd (
  node_modules\.bin\electron.cmd .
) else (
  echo Electron wurde nicht gefunden.
  echo Bitte installiere die App zuerst einmalig mit "npm install".
  pause
)
