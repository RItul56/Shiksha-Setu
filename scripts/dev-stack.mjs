import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localDir = path.join(root, '.local-data');
const dataDir = path.join(localDir, 'postgres');
const configPath = path.join(localDir, 'dev-secrets.json');
const envPath = path.join(root, '.env');
const port = 5447;
const isWindows = process.platform === 'win32';
const tsxCli = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const children = [];
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options, shell: options.shell ?? (isWindows && /\.cmd$/i.test(command)) });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed (exit ${result.status ?? 'unknown'}).`);
};

async function findPgBin() {
  if (process.env.PG_BIN && existsSync(path.join(process.env.PG_BIN, `initdb${isWindows ? '.exe' : ''}`))) return process.env.PG_BIN;
  const base = 'C:\\Program Files\\PostgreSQL';
  if (isWindows && existsSync(base)) {
    const versions = (await readdir(base, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const version of versions) {
      const candidate = path.join(base, version, 'bin');
      if (existsSync(path.join(candidate, 'initdb.exe'))) return candidate;
    }
  }
  const candidates = ['/usr/lib/postgresql/18/bin', '/usr/lib/postgresql/17/bin', '/usr/bin', '/opt/homebrew/opt/postgresql@17/bin'];
  for (const candidate of candidates) if (existsSync(path.join(candidate, 'initdb'))) return candidate;
  throw new Error('PostgreSQL server tools were not found. Install PostgreSQL 16+ or set PG_BIN to its bin folder, then run npm run dev again.');
}

async function loadConfig() {
  await mkdir(localDir, { recursive: true });
  if (existsSync(configPath)) return JSON.parse(await readFile(configPath, 'utf8'));
  const config = {
    superPassword: randomBytes(32).toString('base64url'),
    appPassword: randomBytes(32).toString('base64url'),
    adminPassword: randomBytes(24).toString('base64url'),
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  return config;
}

async function configureLocalDatabase() {
  const existing = existsSync(envPath) ? parse(await readFile(envPath)) : {};
  const hasExternalDatabase = existing.DATABASE_URL && !existing.DATABASE_URL.includes(':5447/') && !existing.DATABASE_URL.includes('change-me');
  if (hasExternalDatabase) {
    console.log('Using the DATABASE_URL already configured in .env.');
    return;
  }
  const pgBin = await findPgBin();
  const pg = name => path.join(pgBin, `${name}${isWindows ? '.exe' : ''}`);
  const config = await loadConfig();
  if (!existsSync(path.join(dataDir, 'PG_VERSION'))) {
    await mkdir(dataDir, { recursive: true });
    const passwordFile = path.join(localDir, 'initdb-password.tmp');
    await writeFile(passwordFile, `${config.superPassword}\n`, { mode: 0o600 });
    try {
      run(pg('initdb'), ['-D', dataDir, '-U', 'platform_admin', '--pwfile', passwordFile, '--auth-host=scram-sha-256', '--auth-local=scram-sha-256', '--encoding=UTF8']);
    } finally {
      await import('node:fs/promises').then(({ rm }) => rm(passwordFile, { force: true }));
    }
    console.log('Initialized a private local PostgreSQL cluster.');
  } else {
    const status = spawnSync(pg('pg_isready'), ['-h', '127.0.0.1', '-p', String(port)], { cwd: root, stdio: 'ignore' });
    if (status.status !== 0) await startLocalPostgres(pgBin);
  }
  if (spawnSync(pg('pg_isready'), ['-h', '127.0.0.1', '-p', String(port)], { cwd: root, stdio: 'ignore' }).status !== 0) await startLocalPostgres(pgBin);
  const adminEnv = { ...process.env, PGPASSWORD: config.superPassword };
  run(pg('psql'), ['-h', '127.0.0.1', '-p', String(port), '-U', 'platform_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', `DO $block$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='shiksha') THEN CREATE ROLE shiksha LOGIN PASSWORD '${config.appPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE; ELSE ALTER ROLE shiksha PASSWORD '${config.appPassword}'; END IF; END $block$;`], { env: adminEnv });
  const dbExists = spawnSync(pg('psql'), ['-h', '127.0.0.1', '-p', String(port), '-U', 'platform_admin', '-d', 'postgres', '-tAc', "SELECT 1 FROM pg_database WHERE datname='shiksha'"], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], env: adminEnv });
  if (dbExists.status !== 0) throw new Error('Could not check whether the local student database exists.');
  if (dbExists.stdout.trim() !== '1') run(pg('psql'), ['-h', '127.0.0.1', '-p', String(port), '-U', 'platform_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', 'CREATE DATABASE shiksha OWNER shiksha;'], { env: adminEnv });
  else run(pg('psql'), ['-h', '127.0.0.1', '-p', String(port), '-U', 'platform_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', 'ALTER DATABASE shiksha OWNER TO shiksha;'], { env: adminEnv });
  const env = {
    VITE_API_BASE_URL: '/api',
    DATABASE_URL: `postgresql://shiksha:${config.appPassword}@127.0.0.1:${port}/shiksha`,
    APP_ORIGIN: 'http://localhost:5173',
    APP_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
    SESSION_SECRET: randomBytes(48).toString('base64url'),
    NODE_ENV: 'development',
    PORT: '8000',
    PG_POOL_MAX: '20',
    ADMIN_EMAIL: 'admin@local.shikshasetu.test',
    ADMIN_PASSWORD: config.adminPassword,
  };
  // Keep existing provider configuration, but never overwrite an existing database URL or secrets.
  const effective = {
    ...env,
    ...existing,
    DATABASE_URL: hasExternalDatabase ? existing.DATABASE_URL : env.DATABASE_URL,
    SESSION_SECRET: existing.SESSION_SECRET && !existing.SESSION_SECRET.startsWith('replace-with') ? existing.SESSION_SECRET : env.SESSION_SECRET,
    ADMIN_PASSWORD: existing.ADMIN_PASSWORD || env.ADMIN_PASSWORD,
  };
  await writeFile(envPath, `${Object.entries(effective).map(([key, value]) => `${key}=${value}`).join('\n')}\n`, { mode: 0o600 });
  if (!existing.ADMIN_PASSWORD) console.log(`Local administrator: ${effective.ADMIN_EMAIL}\nTemporary password: ${effective.ADMIN_PASSWORD}\nKeep this password private; it is also saved in .env.`);
}

async function startLocalPostgres(pgBin) {
  const postgres = path.join(pgBin, `postgres${isWindows ? '.exe' : ''}`);
  const pgIsReady = path.join(pgBin, `pg_isready${isWindows ? '.exe' : ''}`);
  const proc = spawn(postgres, ['-D', dataDir, '-h', '127.0.0.1', '-p', String(port)], { cwd: root, stdio: 'inherit' });
  proc.on('error', error => console.error('Could not start local PostgreSQL:', error.message));
  for (let attempt = 0; attempt < 50; attempt++) {
    const ready = spawnSync(pgIsReady, ['-h', '127.0.0.1', '-p', String(port)], { cwd: root, stdio: 'ignore' });
    if (ready.status === 0) { proc.unref(); return; }
    if (proc.exitCode !== null) throw new Error(`PostgreSQL exited during startup (exit ${proc.exitCode}).`);
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  throw new Error('Local PostgreSQL did not become ready within 20 seconds. Check .local-data/postgres.log.');
}

function child(args) {
  const proc = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', env: process.env });
  proc.on('error', error => { console.error(error); process.exitCode = 1; });
  proc.on('exit', code => { if (code && code !== 0) process.exitCode = code; });
  return proc;
}

try {
  await configureLocalDatabase();
  if (!existsSync(tsxCli) || !existsSync(viteCli)) throw new Error('Dependencies are missing. Run npm install (or pnpm install) in the project folder, then restart.');
  run(process.execPath, [tsxCli, 'server/src/migrate.ts']);
  run(process.execPath, [tsxCli, 'server/src/seed.ts']);
  children.push(child([tsxCli, 'watch', 'server/src/index.ts']));
  children.push(child([viteCli, '--host', '0.0.0.0']));
  console.log('ShikshaSetu is starting. Open the Vite URL shown below; /api is proxied to the API.');
} catch (error) {
  console.error(`Local platform startup failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}

async function stop() {
  for (const proc of children) proc.kill('SIGTERM');
}
process.on('SIGINT', () => { void stop(); });
process.on('SIGTERM', () => { void stop(); });
