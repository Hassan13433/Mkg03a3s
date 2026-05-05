#!/usr/bin/env node

/**
 * Build-Skript für mkg03a3s Installer
 * Erstellt Installer mit electron-builder und kopiert sie zum Download
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, 'dist');
const RELEASE_DIR = path.join(ROOT, 'release');
const DOWNLOAD_DIR = path.join(ROOT, 'downloads');

console.log('🔨 mkg03a3s Installer Builder');
console.log('================================\n');

// Cleanup old build directories
function cleanupOldBuilds() {
  console.log('🧹 Bereinigung alter Build-Verzeichnisse...');
  const dirs = [DIST_DIR, RELEASE_DIR];
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`  ✓ Gelöscht: ${dir}`);
      } catch (e) {
        console.warn(`  ⚠ Konnte nicht löschen: ${dir}`);
      }
    }
  }
}

// Build installer
function buildInstaller() {
  console.log('\n📦 Baue Installer mit electron-builder...');
  try {
    execSync('npm run dist:all', { 
      cwd: ROOT,
      stdio: 'inherit',
      shell: true 
    });
    console.log('  ✓ Installer erfolgreich gebaut!');
    return true;
  } catch (error) {
    console.error('  ✗ Fehler beim Bauen:', error.message);
    return false;
  }
}

// Copy files to downloads directory
function copyToDownloads() {
  console.log('\n📋 Kopiere Installer zum Download-Ordner...');
  
  // Ensure downloads directory exists
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  // Find installer files
  const BUILD_PATHS = [
    path.join(ROOT, 'release'),
    path.join(ROOT, 'dist'),
    path.join(ROOT, 'out')
  ];

  let found = false;

  for (const basePath of BUILD_PATHS) {
    if (!fs.existsSync(basePath)) continue;

    // Look for .exe files recursively
    findExeFiles(basePath, (exePath) => {
      const filename = path.basename(exePath);
      const destPath = path.join(DOWNLOAD_DIR, filename);
      
      try {
        fs.copyFileSync(exePath, destPath);
        console.log(`  ✓ Kopiert: ${filename}`);
        found = true;
      } catch (e) {
        console.warn(`  ⚠ Konnte nicht kopieren: ${filename}`);
      }
    });
  }

  if (!found) {
    console.warn('  ⚠ Keine .exe-Dateien gefunden!');
  }

  return found;
}

function findExeFiles(dir, callback) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findExeFiles(fullPath, callback);
    } else if (entry.endsWith('.exe')) {
      callback(fullPath);
    }
  }
}

// Print summary
function printSummary() {
  console.log('\n📊 Build-Zusammenfassung');
  console.log('========================\n');
  
  if (fs.existsSync(DOWNLOAD_DIR)) {
    const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.exe'));
    if (files.length > 0) {
      console.log('✅ Installer verfügbar:');
      files.forEach(f => {
        const size = (getFileSize(path.join(DOWNLOAD_DIR, f)) / 1024 / 1024).toFixed(2);
        console.log(`   • ${f} (${size} MB)`);
      });
      return true;
    }
  }
  
  console.log('⚠ Keine Installer gefunden');
  return false;
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

// Main execution
async function main() {
  try {
    cleanupOldBuilds();
    
    if (!buildInstaller()) {
      process.exit(1);
    }
    
    copyToDownloads();
    
    const success = printSummary();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Build fehlgeschlagen:', error.message);
    process.exit(1);
  }
}

main();
