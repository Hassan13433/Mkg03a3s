require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(mod => mod.default(...args)));
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(cors());
app.use(express.json());

// Download-Endpoints für Installer
app.get('/download/installer', (req, res) => {
  try {
    const downloadsDir = path.join(__dirname, 'downloads');
    
    let installerPath = null;
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir);
      const setupFile = files.find(f => f.includes('Setup') && f.endsWith('.exe'));
      if (setupFile) {
        installerPath = path.join(downloadsDir, setupFile);
      }
    }
    
    if (!installerPath || !fs.existsSync(installerPath)) {
      const releaseDir = path.join(__dirname, 'release');
      if (fs.existsSync(releaseDir)) {
        const walkDir = (dir) => {
          const entries = fs.readdirSync(dir);
          for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              const found = walkDir(fullPath);
              if (found) return found;
            } else if (entry.includes('Setup') && entry.endsWith('.exe')) {
              return fullPath;
            }
          }
          return null;
        };
        installerPath = walkDir(releaseDir);
      }
    }
    
    if (!installerPath || !fs.existsSync(installerPath)) {
      const zipFallback = path.join(__dirname, 'mkg03a3s-app.zip');
      if (fs.existsSync(zipFallback)) {
        installerPath = zipFallback;
      }
    }
    
    if (installerPath && fs.existsSync(installerPath)) {
      const filename = path.basename(installerPath);
      res.download(installerPath, filename);
    } else {
      res.status(404).json({ error: 'Installer nicht gefunden. Bitte bauen Sie den Installer mit: npm run build-installer' });
    }
  } catch (error) {
    console.error('Download-Fehler:', error);
    res.status(500).json({ error: 'Download fehlgeschlagen' });
  }
});

app.get('/download/portable', (req, res) => {
  try {
    const downloadsDir = path.join(__dirname, 'downloads');
    
    let portablePath = null;
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir);
      const portableFile = files.find(f => !f.includes('Setup') && f.endsWith('.exe'));
      if (portableFile) {
        portablePath = path.join(downloadsDir, portableFile);
      }
    }
    
    if (!portablePath || !fs.existsSync(portablePath)) {
      const releaseDir = path.join(__dirname, 'release');
      if (fs.existsSync(releaseDir)) {
        const walkDir = (dir) => {
          const entries = fs.readdirSync(dir);
          for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              const found = walkDir(fullPath);
              if (found) return found;
            } else if (!entry.includes('Setup') && entry.endsWith('.exe')) {
              return fullPath;
            }
          }
          return null;
        };
        portablePath = walkDir(releaseDir);
      }
    }
    
    if (portablePath && fs.existsSync(portablePath)) {
      const filename = path.basename(portablePath);
      res.download(portablePath, filename);
    } else {
      res.status(404).json({ error: 'Portable Version nicht gefunden. Bitte bauen Sie den Installer mit: npm run build-installer' });
    }
  } catch (error) {
    console.error('Download-Fehler:', error);
    res.status(500).json({ error: 'Download fehlgeschlagen' });
  }
});

app.use(express.static(__dirname));

const STATIC_HTML_FILE = path.join(__dirname, 'index.html');
const CHAT_HISTORY_FILE = path.join(__dirname, 'chat_history.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mkg03a3s';
const AUTO_MODEL = 'auto';
const LOCAL_MODEL = 'local';
const CLAUDE_MODEL_ALIAS = 'claude';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3.5';
const SUPPORTS_ANTHROPIC = Boolean(ANTHROPIC_API_KEY);
const SEARCH_PROVIDER = process.env.SEARCH_PROVIDER || 'duckduckgo';
const SEARCH_API_KEY = process.env.SEARCH_API_KEY || '';
const SEARCH_BING_KEY = process.env.SEARCH_BING_KEY || '';
const SEARCH_CX = process.env.SEARCH_CX || '';
const SEARCH_RESULTS_COUNT = Number(process.env.SEARCH_RESULTS_COUNT || 5);
const SERVER_PORT = process.env.PORT || 3000;
const SERVER_BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_ALLOWED_CHAT_IDS = (process.env.TELEGRAM_ALLOWED_CHAT_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

async function loadChatHistoryFile() {
  try {
    const data = await fsPromises.readFile(CHAT_HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return { sessions: { default: parsed } };
    }
    if (parsed && typeof parsed === 'object' && parsed.sessions) {
      return parsed;
    }
    return { sessions: { default: [] } };
  } catch (error) {
    return { sessions: { default: [] } };
  }
}

async function saveChatHistory(sessionId, history) {
  try {
    const data = await loadChatHistoryFile();
    data.sessions = data.sessions || {};
    data.sessions[sessionId] = history;
    await fsPromises.writeFile(CHAT_HISTORY_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fehler beim Speichern des Chat-Verlaufs:', error);
  }
}

async function loadChatHistory(sessionId = 'default') {
  try {
    const data = await loadChatHistoryFile();
    return Array.isArray(data.sessions?.[sessionId]) ? data.sessions[sessionId] : [];
  } catch (error) {
    return [];
  }
}

async function loadConfig() {
  try {
    const data = await fsPromises.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { selectedModel: AUTO_MODEL };
  }
}

async function saveConfig(config) {
  try {
    await fsPromises.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Fehler beim Speichern der Konfiguration:', error);
  }
}

async function ensureDataFiles() {
  try {
    await fsPromises.access(CONFIG_FILE);
  } catch {
    await saveConfig({ selectedModel: AUTO_MODEL });
  }

  try {
    await fsPromises.access(CHAT_HISTORY_FILE);
  } catch {
    await fsPromises.writeFile(CHAT_HISTORY_FILE, JSON.stringify({ sessions: { default: [] } }, null, 2));
  }
}

const PREFERRED_AUTO_MODELS = [
  'deepseek-coder:1.3b',
  'starcoder2:3b',
  'neural-chat:latest',
  'mistral:latest',
  'llama3:latest',
  'starling-lm:latest'
];

const LIGHTWEIGHT_MODELS = [
  'deepseek-coder:1.3b',
  'starcoder2:3b',
  'neural-chat:latest',
  'mistral:latest',
  'llama3:latest',
  'starling-lm:latest'
];

const OFFLINE_MODEL_LIST = [LOCAL_MODEL, AUTO_MODEL, 'all'];

const CODE_MARKER_MODELS = ['deepseek-coder:1.3b', 'starcoder2:3b'];

function extractReply(data) {
  return data.completion
    || data.choices?.[0]?.message?.content
    || data.choices?.[0]?.text
    || data.output?.[0]?.content?.[0]?.text
    || data.text
    || '';
}

const MODEL_CACHE_TTL = 60 * 1000; // 60 Sekunden
const MAX_HISTORY_MESSAGES = 16;
const MAX_TOKENS = 400;
const MODEL_REQUEST_TIMEOUT = 60000; // 60 Sekunden

async function fetchWithTimeout(url, options = {}, timeout = MODEL_REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function requestClaude(prompt) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API-Key nicht gesetzt.');
  }
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: MAX_TOKENS,
      temperature: 0.7,
      stop_sequences: ['\n\nHuman:']
    })
  }, MODEL_REQUEST_TIMEOUT);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic Fehler: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.completion || '';
}

let cachedModels = {
  data: [],
  timestamp: 0
};

async function getAvailableModels() {
  const now = Date.now();
  if (now - cachedModels.timestamp < MODEL_CACHE_TTL && Array.isArray(cachedModels.data) && cachedModels.data.length > 0) {
    return cachedModels.data;
  }

  try {
    const response = await fetchWithTimeout(`${OLLAMA_HOST}/v1/models`, { method: 'GET' }, 6000);
    if (!response.ok) {
      throw new Error(`Ollama API Fehler: ${response.status}`);
    }
    const data = await response.json();
    const models = Array.isArray(data?.data) ? data.data.map(model => model.id) : [];
    const availablePreferred = models.filter(model => PREFERRED_AUTO_MODELS.includes(model));
    const availableLightweight = models.filter(model => LIGHTWEIGHT_MODELS.includes(model));
    const finalModels = availablePreferred.length > 0
      ? availablePreferred
      : (availableLightweight.length > 0 ? availableLightweight : (models.length > 0 ? models : []));
    const extraModels = SUPPORTS_ANTHROPIC ? [CLAUDE_MODEL_ALIAS] : [];
    const resultModels = [...new Set([LOCAL_MODEL, AUTO_MODEL, 'all', ...extraModels, ...finalModels])];
    if (resultModels.length > 0) {
      cachedModels = { data: resultModels, timestamp: now };
    }
    return resultModels;
  } catch (error) {
    console.error('Fehler beim Abrufen der verfügbaren Modelle:', error);
    const fallbackModels = [...new Set([...OFFLINE_MODEL_LIST, ...(SUPPORTS_ANTHROPIC ? [CLAUDE_MODEL_ALIAS] : []), ...cachedModels.data])];
    cachedModels = { data: fallbackModels, timestamp: now };
    return fallbackModels;
  }
}

const GENERAL_CHAT_MODELS = ['neural-chat:latest', 'mistral:latest', 'llama3:latest', 'starling-lm:latest'];
const FAST_FALLBACK_MODELS = ['mistral:latest', 'neural-chat:latest', 'llama3:latest', 'starling-lm:latest'];

async function fetchSearchResults(query) {
  const normalized = query.trim();

  if (SEARCH_PROVIDER === 'serpapi' && SEARCH_API_KEY) {
    const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(normalized)}&api_key=${SEARCH_API_KEY}&num=${SEARCH_RESULTS_COUNT}`;
    const response = await fetchWithTimeout(url, { method: 'GET' }, 20000);
    if (!response.ok) {
      throw new Error(`SerpAPI Fehler: ${response.status}`);
    }
    const data = await response.json();
    return (data.organic_results || []).slice(0, SEARCH_RESULTS_COUNT).map(item => ({
      title: item.title || item.snippet || item.link || normalized,
      snippet: item.snippet || item.description || '',
      link: item.link || item.displayed_link || ''
    }));
  }

  if (SEARCH_PROVIDER === 'bing' && SEARCH_BING_KEY) {
    const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(normalized)}&count=${SEARCH_RESULTS_COUNT}`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'Ocp-Apim-Subscription-Key': SEARCH_BING_KEY }
    }, 20000);
    if (!response.ok) {
      throw new Error(`Bing-Suche Fehler: ${response.status}`);
    }
    const data = await response.json();
    return (data.webPages?.value || []).slice(0, SEARCH_RESULTS_COUNT).map(item => ({
      title: item.name || '',
      snippet: item.snippet || '',
      link: item.url || ''
    }));
  }

  const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(normalized)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
  const response = await fetchWithTimeout(ddgUrl, { method: 'GET' }, 20000);
  if (!response.ok) {
    throw new Error(`DuckDuckGo Fehler: ${response.status}`);
  }
  const data = await response.json();
  const results = [];
  if (data.AbstractURL) {
    results.push({ title: data.Heading || normalized, snippet: data.AbstractText || '', link: data.AbstractURL });
  }
  if (Array.isArray(data.RelatedTopics)) {
    data.RelatedTopics.forEach(topic => {
      if (results.length >= SEARCH_RESULTS_COUNT) return;
      if (topic.Text && topic.FirstURL) {
        results.push({ title: topic.Text, snippet: topic.Result?.replace(/<[^>]+>/g, '') || '', link: topic.FirstURL });
      } else if (topic.Topics) {
        topic.Topics.forEach(sub => {
          if (results.length >= SEARCH_RESULTS_COUNT) return;
          if (sub.Text && sub.FirstURL) {
            results.push({ title: sub.Text, snippet: sub.Result?.replace(/<[^>]+>/g, '') || '', link: sub.FirstURL });
          }
        });
      }
    });
  }
  return results.slice(0, SEARCH_RESULTS_COUNT);
}

function parseSearchCommand(text) {
  const trimmed = text.trim();
  const directMatch = trimmed.match(/^(\/search|\/suche|search:|suche:|google:)\s*(.+)/i);
  if (directMatch) {
    return { query: directMatch[2].trim(), command: directMatch[1] };
  }

  const prefixMatch = trimmed.match(/^(suche|search|google|finde)\s+(.+)/i);
  if (prefixMatch) {
    return { query: prefixMatch[2].trim(), command: prefixMatch[1] };
  }

  return null;
}

function formatSearchResults(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return 'Keine Suchergebnisse gefunden.';
  }

  return results.map((item, index) => {
    const title = item.title || 'Ohne Titel';
    const snippet = item.snippet ? `${item.snippet}` : '';
    const link = item.link ? `${item.link}` : '';
    return `${index + 1}. ${title}${snippet ? '\n' + snippet : ''}${link ? '\n' + link : ''}`;
  }).join('\n\n');
}

function isCodeRequest(text) {
  return /javascript|python|html|css|react|node|code|funktion|schleife|debug|syntax|programm|skript|webseite|website|webseitte|homepage|landingpage|seite|web/.test(text);
}

function isCreativeRequest(text) {
  return /story|geschichte|erzähle|schreibe|poesie|lied|text|beschreibung/.test(text);
}

function chooseBestModel(message, availableModels) {
  const lower = message.toLowerCase();
  const preferCode = availableModels.find(model => CODE_MARKER_MODELS.includes(model));
  const preferLogic = availableModels.find(model => PREFERRED_AUTO_MODELS.includes(model));
  const preferLight = availableModels.find(model => LIGHTWEIGHT_MODELS.includes(model));
  const preferClaude = availableModels.find(model => /claude|anthropic/.test(model.toLowerCase()));
  const fastWebsiteModel = availableModels.find(model => ['mistral:latest', 'neural-chat:latest', 'llama3:latest', 'starling-lm:latest'].includes(model));
  const isWebsiteRequest = /webseite|website|webseitte|homepage|landingpage|html|css|seite|web/.test(lower);

  if (isCodeRequest(lower)) {
    if (isWebsiteRequest) {
      return fastWebsiteModel
        || preferCode
        || preferLogic
        || preferLight
        || availableModels[0];
    }

    return preferCode
      || availableModels.find(model => model.toLowerCase().includes('code'))
      || preferLogic
      || preferLight
      || availableModels[0];
  }

  if (isCreativeRequest(lower)) {
    return preferClaude
      || availableModels.find(model => /starling|llama3|mistral|neural-chat/.test(model.toLowerCase()))
      || preferLogic
      || preferLight
      || availableModels[0];
  }

  return preferLogic
    || preferLight
    || preferClaude
    || availableModels.find(model => GENERAL_CHAT_MODELS.includes(model))
    || availableModels[0];
}

const SYSTEM_PROMPT = `Du bist mkg03a3s, eine intelligente und selbstständig denkende KI-Assistentin. Denke strukturiert, analysiere die Frage genau und nutze klare Logik. Gib zuerst eine präzise, praktische Antwort und erkläre dann kurz, wie du darauf gekommen bist. Antworte auf Deutsch, wenn der Nutzer Deutsch schreibt, sonst auf Englisch. Nutze gesunden Menschenverstand, ziehe relevante Details aus dem bisherigen Verlauf heran und beantworte die Frage mit smarten, nachvollziehbaren Schritten.`;

const GERMAN_NUMBER_WORDS = {
  eins: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  dreizehn: 13,
  vierzehn: 14,
  fünfzehn: 15,
  sechzehn: 16,
  siebzehn: 17,
  achtzehn: 18,
  neunzehn: 19,
  zwanzig: 20,
  dreißig: 30,
  vierzig: 40,
  fünfzig: 50,
  hundert: 100,
};

function parseNumberToken(token) {
  if (!token) return null;
  const cleaned = token.trim().replace(/[,\.]+/g, '.').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue');
  if (/^-?\d+(?:\.\d+)?$/.test(cleaned)) {
    return Number(cleaned.replace(',', '.'));
  }
  return GERMAN_NUMBER_WORDS[cleaned] ?? null;
}

function trySimpleMath(text) {
  const lower = text.toLowerCase();

  if (!/(plus|minus|mal|\+|\-|\*|\/|geteilt)/.test(lower)) {
    return null;
  }

  const normalized = lower
    .replace(/durch/g, '/')
    .replace(/geteilt/g, '/')
    .replace(/mal/g, '*')
    .replace(/×/g, '*')
    .replace(/plus/g, '+')
    .replace(/minus/g, '-')
    .replace(/[^0-9a-zäöüß+\-*/ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = normalized.split(' ');
  let operatorIndex = tokens.findIndex(token => ['+', '-', '*', '/'].includes(token));
  if (operatorIndex < 0) {
    return null;
  }

  const left = parseNumberToken(tokens[operatorIndex - 1]);
  const right = parseNumberToken(tokens[operatorIndex + 1]);
  if (left === null || right === null) {
    return null;
  }

  let result;
  switch (tokens[operatorIndex]) {
    case '+': result = left + right; break;
    case '-': result = left - right; break;
    case '*': result = left * right; break;
    case '/': result = right === 0 ? null : left / right; break;
    default: result = null;
  }

  if (result === null || Number.isNaN(result)) {
    return null;
  }

  const formattedResult = Number.isInteger(result) ? result : Number(result.toFixed(6));
  return `Das Ergebnis ist ${formattedResult}. (${left} ${tokens[operatorIndex]} ${right} = ${formattedResult})`;
}

function generateSimpleWebsiteResponse() {
  return 'Hier ein einfaches Webseiten-Beispiel, das du direkt verwenden kannst:\n\n<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Meine einfache Webseite</title>\n  <style>\n    body { font-family: Arial, sans-serif; background: #121827; color: #ede9fe; margin: 0; padding: 40px; }\n    main { max-width: 760px; margin: auto; background: rgba(255,255,255,0.05); padding: 24px; border-radius: 18px; }\n    h1 { color: #7c3aed; }\n    a { color: #86efac; }\n  </style>\n</head>\n<body>\n  <main>\n    <h1>Willkommen auf meiner Webseite</h1>\n    <p>Dies ist ein einfacher Startpunkt für deine eigene Seite.</p>\n    <p>Schreibe hier deinen Text oder füge weitere Abschnitte hinzu.</p>\n    <a href="#">Mehr erfahren</a>\n  </main>\n</body>\n</html>';
}

function generateTannAIResponse(message, history = []) {
  const text = message.trim();
  const lower = text.toLowerCase();

  const mathResponse = trySimpleMath(lower);
  if (mathResponse) {
    return mathResponse;
  }

  if (/webseite|website|homepage|landingpage|html|css|javascript|js/.test(lower) && /erstelle|mach|zeige|schreibe|erstelle mir|kannst du/.test(lower)) {
    return generateSimpleWebsiteResponse();
  }

  if (/wer bist du|wie heißt du|dein name/.test(lower)) {
    return 'Hey, ich bin mkg03a3s, deine KI-Assistentin. Was kann ich für dich tun?';
  }

  if (/hilfe|hilfe bei|support|problem|fragen|erkläre/.test(lower)) {
    return 'Klar, ich helfe dir gerne! Erzähl mir einfach, was los ist oder was du brauchst.';
  }

  if (/javascript|python|html|css|react|node|code|funktion|schleife|debug|fehler|spar|javascript/.test(lower)) {
    if (/javascript/.test(lower)) {
      return 'Okay, hier ein einfaches JavaScript-Beispiel für eine Funktion, die Text umdreht:\n\n```javascript\nfunction reverseText(text) {\n  return text.split(\'\').reverse().join(\'\');\n}\n```\n\nDie Funktion nimmt einen Text und gibt ihn rückwärts zurück. Einfach, oder?';
    }
    if (/python/.test(lower)) {
      return 'Schau mal, so geht\'s in Python mit einer einfachen Schleife:\n\n```python\nfor i in range(5):\n  print(f"Zeile {i}")\n```\n\nDas gibt die Zahlen 0 bis 4 aus. Nichts Wildes, aber nützlich.';
    }
    return 'Alles klar, ich kann dir bei Code helfen. Sag mir genau, in welcher Sprache und was du machen willst.';
  }

  if (/danke|thx|merci|dankeschön/.test(lower)) {
    return 'Kein Problem! Wenn du noch was brauchst, sag einfach Bescheid.';
  }

  if (/schreibe|erfinde|story|geschichte|erzähl/.test(lower)) {
    return 'Cool, ich schreibe dir gerne was! Welches Thema oder welche Stimmung soll es haben?';
  }

  if (/guten morgen|guten abend|hallo|hi|hey/.test(lower)) {
    return 'Hey! Schön dich zu sehen. Wie geht\'s?';
  }

  const fallbackResponses = [
    'Das klingt interessant. Erzähl mir mehr davon, dann kann ich besser helfen.',
    'Okay, verstanden. Was genau meinst du damit?',
    'Alles klar, ich bin da. Lass uns das zusammen lösen.'
  ];

  const historyHint = history
    .filter(item => item.role === 'user')
    .map(item => item.content)
    .slice(-3)
    .join(' | ');

  if (historyHint) {
    return `Du hast zuletzt gesagt: "${historyHint}". ${fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]}`;
  }

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

app.get('/api/models', async (req, res) => {
  try {
    const availableModels = await getAvailableModels();
    const allModels = [AUTO_MODEL, 'all', ...availableModels];
    res.json({ models: allModels, selectedModel: AUTO_MODEL });
  } catch (error) {
    console.error('Fehler beim Abrufen der Modelle:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Modelle.' });
  }
});

app.get('/api/config', async (req, res) => {
  try {
    const config = await loadConfig();
    res.json({ config });
  } catch (error) {
    console.error('Fehler beim Laden der Konfiguration:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Konfiguration.' });
  }
});

app.post('/api/config', async (req, res) => {
  const { selectedModel } = req.body;
  if (!selectedModel || typeof selectedModel !== 'string') {
    return res.status(400).json({ error: 'Bitte sende ein gültiges Modell im Feld "selectedModel".' });
  }

  try {
    const config = await loadConfig();
    const newConfig = { ...config, selectedModel };
    await saveConfig(newConfig);
    res.json({ config: newConfig });
  } catch (error) {
    console.error('Fehler beim Speichern der Konfiguration:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration.' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const sessionId = req.query.sessionId || 'default';
    const history = await loadChatHistory(sessionId);
    res.json({ history });
  } catch (error) {
    console.error('Fehler beim Laden des Chat-Verlaufs:', error);
    res.status(500).json({ error: 'Fehler beim Laden des Verlaufs.' });
  }
});

app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Bitte sende einen Suchbegriff im Feld "query".' });
  }

  try {
    const results = await fetchSearchResults(query);
    res.json({ query, provider: SEARCH_PROVIDER, results });
  } catch (error) {
    console.error('Suchfehler:', error);
    res.status(500).json({ error: `Suchfehler: ${error.message}` });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, history, model, sessionId } = req.body;
  const sessionKey = sessionId || 'default';

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Bitte sende eine Nachricht im Feld "message".' });
  }

  const config = await loadConfig();
  const selectedModelRaw = model || config.selectedModel || OLLAMA_MODEL;
  const normalizedSelectedModel = selectedModelRaw.toLowerCase();
  const availableModels = await getAvailableModels();

  let resolvedModel = AUTO_MODEL;
  const matchedAvailableModel = availableModels.find(avail => avail.toLowerCase() === normalizedSelectedModel);

  if (normalizedSelectedModel === LOCAL_MODEL) {
    resolvedModel = LOCAL_MODEL;
  } else if (normalizedSelectedModel === AUTO_MODEL || normalizedSelectedModel === 'all' || normalizedSelectedModel === 'alle-modelle') {
    resolvedModel = chooseBestModel(message, availableModels);
  } else if (matchedAvailableModel) {
    resolvedModel = matchedAvailableModel;
  } else if (availableModels.includes(LOCAL_MODEL)) {
    resolvedModel = LOCAL_MODEL;
  } else {
    resolvedModel = selectedModelRaw;
  }

  if (resolvedModel !== selectedModelRaw && matchedAvailableModel) {
    console.warn(`Ausgewähltes Modell '${selectedModelRaw}' wurde nicht gefunden. Verwende stattdessen '${resolvedModel}'.`);
  }

  const recentHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_MESSAGES) : [];
  const promptHistory = recentHistory.length > 0
    ? recentHistory.map(item => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`).join('\n')
    : '';

  const searchCommand = parseSearchCommand(message);
  let searchResults = null;
  let searchErrorNote = '';

  if (searchCommand) {
    try {
      searchResults = await fetchSearchResults(searchCommand.query);
    } catch (searchError) {
      console.error('Suchfehler beim Verarbeiten der Suchanfrage:', searchError);
      searchErrorNote = `Hinweis: Suche konnte nicht ausgeführt werden (${searchError.message}).`; 
    }
  }

  const selectedModelName = resolvedModel === 'all' ? 'Alle Modelle' : resolvedModel;
  const isCodeModel = selectedModelName.toLowerCase().includes('code') || selectedModelName.toLowerCase().includes('coder') || /starcoder|deepseek/.test(selectedModelName.toLowerCase());
  const modelHint = isCodeModel
    ? 'Du bist ein spezialisiertes Code-Modell. Wenn der Nutzer nach Programmierung, Skripten, Webseiten oder HTML/CSS/JS fragt, antworte mit sauberem, vollständigem Code und liefere funktionierenden Code ohne unnötigem Fluff.'
    : '';

  const modelInstruction = `Du antwortest als Modell: ${selectedModelName}. Nutze die Stärken dieses Modells und beziehe dich auf wichtige Informationen aus dem bisherigen Verlauf.`;
  const websiteHint = /webseite|website|webseitte|homepage|landingpage|html|css|seite|web/.test(message.toLowerCase())
    ? 'Der Nutzer möchte eine Webseite. Antworte mit vollständigem HTML/CSS/JS-Code, der direkt als Webseite verwendbar ist.'
    : '';

  const searchContext = searchResults
    ? `Nutze diese Web-Suchergebnisse, um die Anfrage möglichst genau zu beantworten:
${formatSearchResults(searchResults)}

`
    : '';

  const prompt = `${SYSTEM_PROMPT}${modelHint ? '\n\n' + modelHint : ''}${websiteHint ? '\n\n' + websiteHint : ''}${searchErrorNote ? '\n\n' + searchErrorNote : ''}\n\n${searchContext}${modelInstruction}\n\n${promptHistory ? 'Bisheriger Verlauf:\n' + promptHistory + '\n\n' : ''}User: ${message}\nAssistant:`;

  async function performRequest(modelName) {
    const response = await fetchWithTimeout(`${OLLAMA_HOST}/v1/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        prompt,
        max_tokens: MAX_TOKENS,
        temperature: 0.7
      })
    }, MODEL_REQUEST_TIMEOUT);
    return response;
  }

  async function performModelRequest(modelName) {
    if (modelName === LOCAL_MODEL) {
      return { model: modelName, reply: generateTannAIResponse(message, Array.isArray(history) ? history : []), error: null };
    }
    if (modelName === CLAUDE_MODEL_ALIAS) {
      try {
        const reply = await requestClaude(message);
        return { model: modelName, reply: reply || 'Keine Antwort erhalten.', error: null };
      } catch (modelError) {
        return { model: modelName, reply: '', error: modelError.message };
      }
    }
    if ([AUTO_MODEL, 'all'].includes(modelName)) {
      return null;
    }
    try {
      const modelResp = await performRequest(modelName);
      if (!modelResp.ok) {
        const errorText = await modelResp.text();
        return { model: modelName, reply: `Fehler: ${modelResp.status}`, error: errorText };
      }
      const data = await modelResp.json();
      return { model: modelName, reply: extractReply(data) || 'Keine Antwort erhalten.', error: null };
    } catch (modelError) {
      return { model: modelName, reply: '', error: modelError.message };
    }
  }

  try {
    let reply = '';
    if (resolvedModel === 'all' || resolvedModel === 'alle-modelle') {
      const models = await getAvailableModels();
      const remoteModels = Array.isArray(models)
        ? models.filter(modelName => ![LOCAL_MODEL, AUTO_MODEL, 'all'].includes(modelName))
        : [];

      if ((!remoteModels || remoteModels.length === 0) && models.includes(LOCAL_MODEL)) {
        reply = generateTannAIResponse(message, Array.isArray(history) ? history : []);
      } else if (!Array.isArray(models) || models.length === 0) {
        throw new Error('Keine Modelle verfügbar. Prüfe die Ollama-Verbindung und installierte Modelle.');
      } else {
        const responses = await Promise.all(models.map(async modelName => performModelRequest(modelName)));
        const filteredResponses = responses.filter(Boolean);
        reply = filteredResponses.map(result => {
          if (result.error) {
            return `Modell ${result.model}: Fehler (${result.error})`;
          }
          return `Modell ${result.model}:\n${result.reply}`;
        }).join('\n\n---\n\n');
      }
    } else {
      async function performRequest(modelName) {
        const response = await fetchWithTimeout(`${OLLAMA_HOST}/v1/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            prompt,
            max_tokens: MAX_TOKENS,
            temperature: 0.7
          })
        }, MODEL_REQUEST_TIMEOUT);
        return response;
      }

      let response;
      if (resolvedModel === LOCAL_MODEL) {
        reply = generateTannAIResponse(message, Array.isArray(history) ? history : []);
      } else if (resolvedModel === CLAUDE_MODEL_ALIAS) {
        const result = await performModelRequest(resolvedModel);
        if (result.error) {
          console.error('Claude-Fehler:', result.error);
          reply = generateTannAIResponse(message, Array.isArray(history) ? history : []);
        } else {
          reply = result.reply;
        }
      } else {
        try {
          response = await performRequest(resolvedModel);
        } catch (requestError) {
          const isAbort = requestError?.name === 'AbortError' || /abort/i.test(requestError?.message || '');
          const fallbackModel = availableModels.find(model => FAST_FALLBACK_MODELS.includes(model) && model !== resolvedModel);

          if (isAbort && fallbackModel) {
            console.warn(`Modell ${resolvedModel} hat abgebrochen. Versuche Fallback-Modell ${fallbackModel}.`);
            resolvedModel = fallbackModel;
            response = await performRequest(resolvedModel);
          } else {
            reply = generateTannAIResponse(message, Array.isArray(history) ? history : []);
          }
        }
      }

      if (response && !response.ok) {
        const errorText = await response.text();
        const fallbackReply = generateTannAIResponse(message, Array.isArray(history) ? history : []);
        console.error('Ollama-Fehler:', response.status, response.statusText, errorText);

        let errorMessage = `Ollama-Fehler: ${response.status} ${response.statusText}`;
        if (errorText && errorText.includes("model '")) {
          errorMessage += ` - Modell '${selectedModelRaw}' wurde nicht gefunden. Bitte installiere es mit Ollama oder ändere OLLAMA_MODEL.`;
        }

        return res.json({ reply: fallbackReply, prompt: SYSTEM_PROMPT, selectedModel: selectedModelRaw, resolvedModel, fallback: true, error: errorMessage });
      }

      if (!reply) {
        const data = await response.json();
        reply = extractReply(data) || 'Fehler beim Abrufen der Antwort.';
      }
    }

    const updatedHistory = [...(Array.isArray(history) ? history : []), { role: 'user', content: message }, { role: 'assistant', content: reply }];
    await saveChatHistory(sessionKey, updatedHistory);

    res.json({ reply, prompt: SYSTEM_PROMPT, searchResults, selectedModel: selectedModelRaw, resolvedModel, fallback: false });
  } catch (error) {
    console.error('Ollama-Fehler:', error);
    const fallbackReply = generateTannAIResponse(message, Array.isArray(history) ? history : []);
    res.json({ reply: fallbackReply, prompt: SYSTEM_PROMPT, selectedModel: selectedModelRaw, resolvedModel, fallback: true, error: 'Fehler beim Verbinden mit Ollama.' });
  }
});

app.get('/', (req, res) => {
  res.type('html');
  res.sendFile(STATIC_HTML_FILE);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nicht gefunden.' });
});

async function fetchTelegramHistory(sessionId) {
  const res = await fetch(`${SERVER_BASE_URL}/api/history?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) {
    throw new Error(`History request failed: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data.history) ? data.history : [];
}

async function handleTelegramMessage(chatId, text) {
  const sessionId = `telegram_${chatId}`;
  const history = await fetchTelegramHistory(sessionId);
  const response = await fetch(`${SERVER_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: text,
      history,
      model: 'auto',
      sessionId
    })
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }
  return response.json();
}

async function initTelegramBot() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('Telegram-Bot nicht konfiguriert. Setze TELEGRAM_BOT_TOKEN in der .env.');
    return;
  }

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  console.log('Telegram-Bot gestartet.');

  bot.on('message', async msg => {
    try {
      const chatId = msg.chat.id.toString();
      if (TELEGRAM_ALLOWED_CHAT_IDS.length > 0 && !TELEGRAM_ALLOWED_CHAT_IDS.includes(chatId)) {
        console.log(`Telegram-Chat ${chatId} nicht zugelassen, Nachricht ignoriert.`);
        return;
      }

      const text = msg.text?.trim();
      if (!text) {
        return;
      }

      console.log(`Telegram-Nachricht von ${chatId}: ${text}`);
      const result = await handleTelegramMessage(chatId, text);
      const reply = result.reply || 'Keine Antwort erhalten.';
      let sendText = reply;

      if (Array.isArray(result.searchResults) && result.searchResults.length > 0) {
        const topLinks = result.searchResults.slice(0, 3).map((item, index) => {
          const title = item.title || `Ergebnis ${index + 1}`;
          const link = item.link || '';
          return `${index + 1}. ${title}${link ? '\n' + link : ''}`;
        }).join('\n\n');

        sendText = `Suchergebnisse:\n${topLinks}\n\nAntwort:\n${reply}`;
      }

      if (result.fallback) {
        sendText += '\n\n(Hinweis: fallback Antwort)';
      }

      await bot.sendMessage(chatId, sendText, { reply_to_message_id: msg.message_id });
    } catch (error) {
      console.error('Telegram-Fehler:', error);
      try {
        await bot.sendMessage(msg.chat.id, 'Entschuldigung, es gab einen Fehler beim Verarbeiten deiner Nachricht.');
      } catch {
        // ignore send errors
      }
    }
  });
}

async function startServer() {
  await ensureDataFiles();
  app.listen(SERVER_PORT, () => {
    console.log(`mkg03a3s API läuft auf http://127.0.0.1:${SERVER_PORT}`);
    initTelegramBot().catch(error => console.error('Telegram-Init fehlgeschlagen:', error));
  });
}

startServer().catch(error => {
  console.error('Serverstart fehlgeschlagen:', error);
});
