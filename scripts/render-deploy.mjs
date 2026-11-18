#!/usr/bin/env node
/**
 * Push environment variables to a Render web service and trigger a deploy.
 *
 * Reads the Render API key from `.render-api-key` (git-ignored) and the values
 * from `server/.env`, so secrets never travel through a terminal argument, the
 * repository or chat. Values are never printed.
 *
 * Usage:  node scripts/render-deploy.mjs [--env-only] [--deploy-only]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SERVICE_ID = process.env.RENDER_SERVICE_ID || 'srv-dbui2ks9v7es738kp70g';
const API = 'https://api.render.com/v1';

const args = new Set(process.argv.slice(2));
const envOnly = args.has('--env-only');
const deployOnly = args.has('--deploy-only');

const parseEnvFile = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

const keyFile = path.join(ROOT, '.render-api-key');
const apiKey = (process.env.RENDER_API_KEY || (fs.existsSync(keyFile) ? fs.readFileSync(keyFile, 'utf8') : '')).trim();

if (!apiKey) {
  console.error('No Render API key found. Create one at https://dashboard.render.com/u/settings#api-keys');
  console.error(`then save it to ${keyFile} (this file is git-ignored).`);
  process.exit(1);
}

const local = parseEnvFile(path.join(ROOT, 'server', '.env'));

const PAYLOAD = [
  ['MONGO_URI', local.MONGO_URI],
  ['JWT_SECRET', local.JWT_SECRET],
  ['JWT_EXPIRES_IN', local.JWT_EXPIRES_IN || '7d'],
  ['ADMIN_EMAIL', local.ADMIN_EMAIL || 'swavi@gmail.com'],
  ['ADMIN_PASSWORD', local.ADMIN_PASSWORD],
  ['NODE_ENV', 'production'],
  ['NODE_VERSION', '22.19.0'],
  ['MAX_RESUME_SIZE_MB', local.MAX_RESUME_SIZE_MB || '5'],
];

const missing = PAYLOAD.filter(([, value]) => !value).map(([key]) => key);
if (missing.length) {
  console.error(`server/.env is missing: ${missing.join(', ')}`);
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const call = async (url, options = {}) => {
  const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url} -> ${response.status} ${body.slice(0, 400)}`);
  }
  return body ? JSON.parse(body) : null;
};

const run = async () => {
  const service = await call(`${API}/services/${SERVICE_ID}`);
  const name = service?.service?.name || service?.name || SERVICE_ID;
  console.log(`Service: ${name} (${SERVICE_ID})`);

  if (!deployOnly) {
    const vars = PAYLOAD.map(([key, value]) => ({ key, value }));
    await call(`${API}/services/${SERVICE_ID}/env-vars`, { method: 'PUT', body: JSON.stringify(vars) });
    console.log(`Environment variables set (${vars.map((v) => v.key).join(', ')}).`);
  }

  if (envOnly) return;

  const deploy = await call(`${API}/services/${SERVICE_ID}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: 'do_not_clear' }),
  });
  const deployId = deploy?.id || deploy?.deploy?.id;
  console.log(`Deploy started: ${deployId}`);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    await sleep(15000);
    const info = await call(`${API}/services/${SERVICE_ID}/deploys/${deployId}`);
    const status = info?.status || info?.deploy?.status || 'unknown';
    console.log(`  ${new Date().toLocaleTimeString()} ${status}`);
    if (['live', 'build_failed', 'update_failed', 'canceled', 'deactivated'].includes(status)) {
      console.log(`Final status: ${status}`);
      if (status !== 'live') process.exitCode = 2;
      return;
    }
  }
  console.log('Still building after ~12 minutes; check the dashboard.');
};

run().catch((error) => {
  console.error(`FAILED: ${error.message}`);
  process.exitCode = 1;
});
