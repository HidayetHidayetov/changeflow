// Usage: node scripts/bump.mjs [patch|minor|major]  (default: patch)
// Bumps version in package.json, tauri.conf.json and Cargo.toml consistently.
import fs from 'node:fs';

const which = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(which)) {
  console.error('Usage: node scripts/bump.mjs [patch|minor|major]');
  process.exit(1);
}

const pkgPath = new URL('../package.json', import.meta.url);
const confPath = new URL('../src-tauri/tauri.conf.json', import.meta.url);
const cargoPath = new URL('../src-tauri/Cargo.toml', import.meta.url);

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
let [major, minor, patch] = pkg.version.split('.').map(Number);
if (which === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
} else if (which === 'minor') {
  minor += 1;
  patch = 0;
} else {
  patch += 1;
}
const next = `${major}.${minor}.${patch}`;
pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const conf = JSON.parse(fs.readFileSync(confPath, 'utf8'));
conf.version = next;
fs.writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n');

let cargo = fs.readFileSync(cargoPath, 'utf8');
const before = cargo;
cargo = cargo.replace(/^version = "\d+\.\d+\.\d+"/m, `version = "${next}"`);
if (cargo === before) {
  console.error('Cargo.toml version not found!');
  process.exit(1);
}
fs.writeFileSync(cargoPath, cargo);

console.log(`bumped to ${next}`);
