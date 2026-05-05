# mkg03a3s - Lokale KI App

Eine einfache, benutzerfreundliche KI-App mit lokaler Ausführung über Ollama. Keine Cloud, keine Datenschutzprobleme - alles läuft auf deinem Computer.

## 🚀 Schnell-Start

### Option 1: Fertige Windows-App installieren (Empfohlen)

1. Gehe zu [Download-Seite](http://127.0.0.1:3000/download.html)
2. Klicke auf "Installer Herunterladen"
3. Führe die `.exe`-Datei aus und folge den Anweisungen
4. Starte die App nach der Installation

### Option 2: Portable Version (Keine Installation nötig)

1. Gehe zu [Download-Seite](http://127.0.0.1:3000/download.html)
2. Klicke auf "Portable Version"
3. Führe die `.exe` direkt aus

### Option 3: Von Quelle starten

```bash
git clone <repo-url>
cd ki
npm install
npm start
```

Dann öffne: http://127.0.0.1:3000

## 📋 Voraussetzungen

- **Windows 10 oder höher**
- **Ollama** installiert ([Download](https://ollama.ai))
- Mindestens 2 GB RAM
- Mindestens ein Ollama-Modell heruntergeladen

## 🔧 Ollama einrichten

1. Laden Sie Ollama von [ollama.ai](https://ollama.ai) herunter
2. Installieren Sie Ollama
3. Starten Sie einen Modell-Server:
   ```bash
   ollama serve
   ```
4. Downloaden Sie ein Modell (in einem neuen Terminal):
   ```bash
   ollama pull mistral
   ```
   oder
   ```bash
   ollama pull neural-chat
   ```

## 🎨 Desktop-App entwickeln

Falls Sie die App selbst entwickeln möchten:

```bash
npm install
npm run desktop
```

## 📦 Installer selbst bauen

Um einen neuen Installer zu erstellen:

```bash
npm run build-installer
```

Das erstellt `.exe`-Dateien im `downloads/` Ordner.

### Manueller Build (falls nötig)

```bash
npm install --save-dev electron-builder
npm run dist
```

## 🌐 Web-Interface

Nachdem der Server läuft, öffnen Sie:
- **App**: http://127.0.0.1:3000
- **Downloads**: http://127.0.0.1:3000/download.html

## 📝 Konfiguration

Erstellen Sie eine `.env` Datei im Projektverzeichnis:

```env
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=mistral
PORT=3000
```

## ❓ Häufig gestellte Fragen

**F: Die App zeigt "Modell nicht gefunden"**
- A: Stellen Sie sicher, dass Ollama läuft (`ollama serve`) und das Modell installiert ist (`ollama pull mistral`)

**F: Kann ich offline arbeiten?**
- A: Ja! Sobald ein Modell heruntergeladen ist, funktioniert alles offline.

**F: Welche Modelle werden unterstützt?**
- A: Alle Modelle, die Ollama unterstützt (Mistral, Neural Chat, Llama 2, etc.)

## 📜 Lizenz

ISC

- Der Installer wird dann im `dist`-Ordner erstellt.
- Alternativ kannst du das Script `build-installer.ps1` verwenden, wenn du unter Windows einen Bauprozess mit einem einzigen Befehl starten möchtest.

## Windows Bootstrap Installer

Die Dateien `download-and-install.ps1` und `download-and-install.bat` sind Bootstrap-Downloader, die eine bereits gebaute `mkg03a3s`-Installer-Datei aus dem Internet herunterladen und starten.

> Für eine vollständig funktionierende Version musst du die Variable `DOWNLOAD_URL` in den Skripten auf deine veröffentlichte Installer-URL setzen.

Beispiel:

```powershell
./build-installer.ps1
```

```powershell
./download-and-install.ps1
```

Oder für Windows-Batch:

```cmd
download-and-install.bat
```

## Verwendung

- Öffne im Browser: `http://127.0.0.1:3000/`
- Wähle dein gewünschtes KI-Modell im Dropdown-Menü in der Header aus (Modelle werden automatisch von Ollama geladen)
- Der Chat-Verlauf wird automatisch gespeichert und beim nächsten Laden wiederhergestellt
- Die App kann direkt aus `index.html` heruntergeladen werden, ohne eine separate Download-Seite
- Die API ist erreichbar unter `POST http://127.0.0.1:3000/api/chat`
- Zusätzlich gibt es einen Such-Endpunkt unter `POST http://127.0.0.1:3000/api/search` für Web-Suche mit `SEARCH_PROVIDER`.
- Die Seite sendet die Anfrage normalerweise an die lokale Ollama-API.
- Falls Ollama nicht erreichbar ist, antwortet die App weiterhin mit einem lokalen Offline-Fallback.

## Suchintegration

Du kannst die App mit einer Web-Suche nutzen, indem du im Chat `suche ...`, `search ...`, `/suche ...` oder `/search ...` benutzt. Der Server nutzt dann den konfigurierten Suchanbieter, um Ergebnisse einzusammeln und die Antwort darauf aufzubauen.

## Hinweis

- Stelle sicher, dass Ollama auf dem angegebenen Host läuft.
- Wenn das Modell `mkg03a3s` nicht installiert ist, kannst du entweder ein verfügbares Modell in `OLLAMA_MODEL` eintragen oder das Modell in Ollama installieren.

Der Server ist aktuell ein einfacher eigener Chat-Endpoint. Er verwendet eine Regel-basierte Antwortlogik, nicht ein trainiertes Modell. Für echtes Training müssten später ein ML-Modell und Daten hinzugefügt werden.
