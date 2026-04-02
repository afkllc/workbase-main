const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ENV_KEY = 'EXPO_PUBLIC_API_BASE_URL';
const ENV_FILE = path.resolve(__dirname, '..', '.env.local');

function detectLocalIp() {
  const interfaces = os.networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    if (!addresses) {
      continue;
    }

    for (const details of addresses) {
      const family = typeof details.family === 'string' ? details.family : `IPv${details.family}`;
      if (family !== 'IPv4') {
        continue;
      }
      if (details.internal || details.address === '127.0.0.1') {
        continue;
      }

      return details.address;
    }
  }

  return null;
}

function upsertEnvVariable(filePath, key, value) {
  const exists = fs.existsSync(filePath);
  const current = exists ? fs.readFileSync(filePath, 'utf8') : '';
  const newline = current.includes('\r\n') ? '\r\n' : os.EOL;
  const rawLines = current.length > 0 ? current.split(/\r?\n/) : [];
  const lines = rawLines.at(-1) === '' ? rawLines.slice(0, -1) : rawLines;

  let updated = false;
  const nextLines = lines.map((line) => {
    if (/^\s*EXPO_PUBLIC_API_BASE_URL\s*=/.test(line)) {
      updated = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!updated) {
    nextLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, `${nextLines.join(newline)}${newline}`, 'utf8');
}

function main() {
  const ip = detectLocalIp();
  if (!ip) {
    console.error('Error: No active non-internal IPv4 address found. .env.local was not changed.');
    process.exit(1);
  }

  const baseUrl = `http://${ip}:8000`;
  upsertEnvVariable(ENV_FILE, ENV_KEY, baseUrl);

  console.log(`Detected local IP: ${ip}`);
  console.log(`${ENV_KEY}=${baseUrl}`);
}

main();
