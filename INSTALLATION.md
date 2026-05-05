# 📋 Detaillierte Installationsanleitung für mkg03a3s

## Schritt 1: Ollama installieren und konfigurieren

Dies ist **erforderlich** für die App zu funktionieren.

### 1.1 Ollama herunterladen
- Besuchen Sie [ollama.ai](https://ollama.ai)
- Laden Sie die Windows-Version herunter
- Installieren Sie Ollama (folgen Sie den Standard-Anweisungen)

### 1.2 Ollama starten
Öffnen Sie ein Terminal (PowerShell oder cmd) und geben Sie ein:
```powershell
ollama serve
```

**⚠️ Wichtig:** Lassen Sie dieses Terminal offen! Der Server muss laufen, damit die App funktioniert.

### 1.3 Ein KI-Modell herunterladen
Öffnen Sie ein **zweites Terminal** und geben Sie ein:
```powershell
ollama pull mistral
```

Dies lädt das "Mistral" Modell herunter (schnell und gut für Anfänger).

**Alternative Modelle:**
- `ollama pull neural-chat` - Chatbot optimiert
- `ollama pull llama2` - Meta's Modell
- `ollama pull dolphin-mixtral` - Leistungsstark

Warten Sie, bis der Download abgeschlossen ist.

## Schritt 2: mkg03a3s App herunterladen

### 2.1 Installer herunterladen
1. Öffnen Sie Ihren Browser
2. Navigieren Sie zu: `http://127.0.0.1:3000/download.html`
3. Klicken Sie auf den großen grünen Button "📥 Installer Herunterladen"
4. Speichern Sie die Datei (z.B. `mkg03a3s Setup 1.0.0.exe`)

### 2.2 Installer ausführen
1. Suchen Sie die heruntergeladene `.exe`-Datei
2. Doppelklicken Sie darauf
3. Klicken Sie auf "Ja" bei der Sicherheitswarnung
4. Der Installationsassistent öffnet sich
5. Klicken Sie durch die Schritte:
   - ✅ Lizenz akzeptieren
   - ✅ Installation bestätigen
   - ✅ Warten Sie bis die Installation abgeschlossen ist
   - ✅ "Fertig" klicken

## Schritt 3: mkg03a3s App starten

### 3.1 App über das Startmenü
- Drücken Sie die `Windows`-Taste
- Tippen Sie "mkg03a3s"
- Klicken Sie auf die App

### 3.2 App über Desktop-Verknüpfung (falls vorhanden)
- Doppelklicken Sie auf die Verknüpfung

## Schritt 4: App verwenden

1. Die App öffnet sich in einem neuen Fenster
2. Wählen Sie ein Modell aus der Dropdown-Liste (z.B. "mistral")
3. Geben Sie eine Frage ein
4. Drücken Sie Enter oder klicken Sie "Senden"
5. Warten Sie auf die Antwort

**💡 Tipps:**
- Die erste Anfrage kann länger dauern (das Modell wird geladen)
- Je höher Ihre CPU/RAM, desto schneller die Antworten
- Die Antwort funktioniert nur wenn Ollama im Hintergrund läuft!

## Fehlerbehebung

### Problem: "Ollama-Server nicht gefunden"
**Lösung:**
1. Öffnen Sie ein Terminal
2. Geben Sie ein: `ollama serve`
3. Warten Sie bis der Server startet

### Problem: "Modell nicht gefunden"
**Lösung:**
1. Öffnen Sie ein zweites Terminal
2. Geben Sie ein: `ollama pull mistral` (oder ein anderes Modell)
3. Warten Sie bis der Download fertig ist
4. Versuchen Sie es in der App erneut

### Problem: App startet nicht
**Lösung:**
1. Überprüfen Sie, ob .NET Runtime installiert ist
2. Besuchen Sie [microsoft.com/dotnet](https://www.microsoft.com/dotnet/download)
3. Laden Sie die "Desktop Runtime" herunter und installieren Sie sie
4. Versuchen Sie die App erneut zu starten

### Problem: App antwortet nicht / ist langsam
**Lösung:**
1. Schließen Sie unnötige Programme
2. Versuchen Sie ein kleineres Modell (`neural-chat` statt `mistral`)
3. Erhöhen Sie die verfügbare RAM/Speicher

## 🔄 App aktualisieren

Wenn Sie eine neue Version installieren möchten:
1. Laden Sie die neue `.exe` herunter
2. Führen Sie sie aus
3. Die alte Version wird automatisch ersetzt

## ❓ Weitere Fragen?

- **Server funktioniert nicht:** Stellen Sie sicher, dass `ollama serve` läuft
- **Langsame Antworten:** Das ist normal für KI-Modelle, versuchen Sie ein kleineres Modell
- **Speichereprobleme:** Löschen Sie alte Chats oder deinstallieren Sie Modelle, die Sie nicht nutzen

## 🎓 Erweiterte Tipps

### Modelle verwalten
```powershell
# Alle installierten Modelle anzeigen
ollama list

# Ein Modell löschen
ollama rm mistral

# Informationen zu einem Modell
ollama show mistral
```

### Standard-Modell ändern
Bearbeiten Sie `.env` Datei im Ordner `C:\Users\{Benutzername}\AppData\Local\mkg03a3s`:
```env
OLLAMA_MODEL=neural-chat
```

### Zur Quelle wechseln (fortgeschrittene Benutzer)
Wenn Sie einen bestimmten Port oder andere Einstellungen brauchen, können Sie die App von der Quelle starten:
```bash
cd C:\path\to\mkg03a3s
npm install
npm start
```

Dann öffnen Sie: `http://127.0.0.1:3000`

---

**✅ Fertig!** Genießen Sie Ihre lokale KI ohne Datenschutzprobleme!
