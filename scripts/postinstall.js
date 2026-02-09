#!/usr/bin/env node

/**
 * Postinstall script for agent-browser-mcp
 *
 * Downloads the platform-specific native binary if not present.
 */

import {
  existsSync,
  mkdirSync,
  chmodSync,
  createWriteStream,
  unlinkSync,
  readFileSync,
  statSync,
} from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { platform, arch } from 'os';
import { get } from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const binDir = join(projectRoot, 'bin');

// Platform detection
const platformKey = `${platform()}-${arch()}`;
const ext = platform() === 'win32' ? '.exe' : '';
const binaryName = `agent-browser-${platformKey}${ext}`;
const binaryPath = join(binDir, binaryName);

// Package info
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf8')
);
const version = packageJson.version;

// GitHub release URL
const GITHUB_REPO = 'quantmew/agent-browser-mcp';
const DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/releases/download/v${version}/${binaryName}`;

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const cleanup = () => {
      try {
        file.close();
      } catch {}
      try {
        if (existsSync(dest)) {
          unlinkSync(dest);
        }
      } catch {}
    };

    const request = (url) => {
      get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          response.resume();
          request(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          cleanup();
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        cleanup();
        reject(err);
      });
    };

    request(url);
  });
}

async function main() {
  // Check if binary already exists and is non-empty
  if (existsSync(binaryPath)) {
    try {
      const stat = statSync(binaryPath);
      if (stat.size > 0) {
        if (platform() !== 'win32') {
          chmodSync(binaryPath, 0o755);
        }
        console.log(`✓ Native binary ready: ${binaryName}`);
        return;
      }

      // Empty/broken placeholder binary, remove and re-download
      unlinkSync(binaryPath);
      console.log(`⚠ Found empty native binary placeholder, re-downloading: ${binaryName}`);
    } catch {
      // Best effort: if stat/delete fails, continue to download path
    }
  }

  // Ensure bin directory exists
  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true });
  }

  console.log(`Downloading native binary for ${platformKey}...`);
  console.log(`URL: ${DOWNLOAD_URL}`);

  try {
    await downloadFile(DOWNLOAD_URL, binaryPath);
    
    // Make executable on Unix
    if (platform() !== 'win32') {
      chmodSync(binaryPath, 0o755);
    }
    
    console.log(`✓ Downloaded native binary: ${binaryName}`);
  } catch (err) {
    console.log(`⚠ Could not download native binary: ${err.message}`);
    console.log(`  The CLI will use Node.js fallback (slightly slower startup)`);
  }

  // Reminder about Playwright browsers
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║ To download browser binaries, run:                                        ║');
  console.log('║                                                                           ║');
  console.log('║     npx playwright install chromium                                       ║');
  console.log('║                                                                           ║');
  console.log('║ On Linux, include system dependencies with:                               ║');
  console.log('║                                                                           ║');
  console.log('║     npx playwright install --with-deps chromium                           ║');
  console.log('║                                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
