// Repo guardrails for the Site Spell Checker Chrome extension. See AGENTS.md. Run with `npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
const packaged = (() => {
  const block = /files=\(([\s\S]*?)\)/.exec(read('scripts/package.sh'))[1];
  return new Set(block.split(/\s+/).filter(Boolean));
})();

test('every version number matches manifest.json', () => {
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(JSON.parse(read('package.json')).version, manifest.version, 'package.json version');
  assert.equal((/^## \[(\d+\.\d+\.\d+)\]/m.exec(read('CHANGELOG.md')) || [])[1], manifest.version, 'newest CHANGELOG.md entry');
});

// 1.1.1 was a Chrome Web Store compliance fix: unused permissions and <all_urls> host access had
// to go. Keep the manifest minimal and every permission explained in PRIVACY.md.
test('permissions stay minimal and documented', () => {
  const documented = [...read('PRIVACY.md').matchAll(/^\| `([^`]+)` \|/gm)].map((m) => m[1]).sort();
  assert.deepEqual([...manifest.permissions].sort(), documented, 'manifest permissions must match the PRIVACY.md table');
  assert.equal(manifest.host_permissions, undefined, 'no host_permissions; use activeTab');
  assert.equal(manifest.optional_host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined, 'inject on demand with chrome.scripting, not on every page');
  assert.equal(manifest.background, undefined, 'no background service worker (removed in 1.1.1)');
  for (const permission of ['tabs', 'webRequest', 'history', 'cookies', '<all_urls>']) {
    assert.ok(!manifest.permissions.includes(permission), `${permission} is not needed`);
  }
});

test('every file the extension loads exists and ships in the zip', () => {
  const loaded = new Set(['manifest.json']);
  for (const icon of Object.values(manifest.icons || {})) loaded.add(icon);
  for (const icon of Object.values(manifest.action?.default_icon || {})) loaded.add(icon);
  loaded.add(manifest.action.default_popup);
  for (const group of manifest.web_accessible_resources || []) group.resources.forEach((r) => loaded.add(r));
  const popup = read(manifest.action.default_popup);
  for (const m of popup.matchAll(/(?:src|href)="(?!https?:|#)([^"]+)"/g)) loaded.add(m[1]);
  for (const m of read('popup.js').matchAll(/files:\s*\[([^\]]+)\]/g)) {
    for (const f of m[1].matchAll(/'([^']+)'/g)) loaded.add(f[1]);
  }
  for (const m of read('content.js').matchAll(/getURL\('([^']+)'\)/g)) loaded.add(m[1]);

  for (const file of loaded) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} is referenced but missing`);
    assert.ok(packaged.has(file), `${file} is loaded but not in scripts/package.sh`);
  }
  for (const file of packaged) {
    assert.ok(fs.existsSync(path.join(root, file)), `scripts/package.sh lists missing ${file}`);
  }
  for (const file of packaged) {
    assert.doesNotMatch(file, /^(\.agents|\.cursor|\.github|tests|scripts)\/|package\.json|\.md$/, `${file} is a dev file`);
  }
});

// PRIVACY.md: "We collect nothing", no automatic network requests, page content never leaves the
// browser. The only outbound link is the user-clicked upsell to sitespellchecker.com.
test('the extension makes no network requests and has no tracking', () => {
  for (const file of ['content.js', 'popup.js', 'lib/dict-worker.js']) {
    const code = read(file);
    assert.doesNotMatch(code, /sendBeacon\(|new XMLHttpRequest|new Image\(|new WebSocket|new EventSource|\b(?:gtag|mixpanel|posthog)\(|umami\.|plausible\(|google-analytics\.com|googletagmanager\.com|importScripts\(\s*['"]https?:/, `${file} must not phone home`);
    for (const url of code.match(/https?:\/\/[^\s'"`)]+/g) || []) {
      assert.match(url, /^https:\/\/sitespellchecker\.com\//, `${file}: unexpected URL ${url}`);
    }
    for (const call of code.matchAll(/\bfetch\(\s*([^,)]+)/g)) {
      assert.match(call[1].trim(), /^(affUrl|dicUrl|e\.data\.(affUrl|dicUrl))$/, `${file}: unexpected fetch(${call[1]})`);
    }
  }
  for (const url of read('popup.html').match(/https?:\/\/[^\s"]+/g) || []) {
    assert.match(url, /^https:\/\/sitespellchecker\.com/, `popup.html: unexpected URL ${url}`);
  }
});

const CLAIMS = {
  'unsourced user count': /(?<![$\d,.])\b\d{1,3}(?:,\d{3})+\s*\+|(?<![$\d,.])\b\d+(?:\.\d+)?\s*[kK]\+|(?<![$\d,.-])\b\d{2,}\+?\s+(?:users|customers|sites|websites|teams|people|businesses|companies|subscribers|installs)\b/g,
  'unsourced accuracy or rate': /\b\d{2,3}(?:\.\d+)?\s*%\s*(?:accura|precis|uptime|satisf|success rate)/gi,
  'unsourced trust badge or rating': /(?:★){3,}|\b\d(?:\.\d)?\s*(?:\/\s*5|out of 5)\s*stars?\b|\btrusted by\b/gi,
  'template placeholder': /\[(?:TBD|TODO|PLACEHOLDER|YOUR [A-Z ]+)\]|lorem ipsum/gi,
  'dev host in public copy': /https?:\/\/[a-z0-9.-]+\.(?:test|local)\b|https?:\/\/(?:localhost|127\.0\.0\.1)\b/gi,
};

test('store listing, popup and docs have no invented numbers, ratings or placeholders', () => {
  const offenders = [];
  const sources = { 'README.md': read('README.md'), 'PRIVACY.md': read('PRIVACY.md'), 'popup.html': read('popup.html'), 'manifest.json': `${manifest.name} ${manifest.description}` };
  for (const [file, text] of Object.entries(sources)) {
    for (const [name, pattern] of Object.entries(CLAIMS)) {
      const hits = text.match(pattern) || [];
      if (hits.length) offenders.push(`${file}: ${name}: ${hits.join(' | ')}`);
    }
  }
  assert.deepEqual(offenders, [], 'Every claim needs a source and Andy\'s OK');
});

test('the claims patterns catch past mistakes', () => {
  for (const [copy, name] of [['Loved by 1000+ users.', 'unsourced user count'], ['Used on 10,000+ sites', 'unsourced user count'], ['<h3>99% Accuracy</h3>', 'unsourced accuracy or rate'], ['★★★★★', 'unsourced trust badge or rating']]) {
    assert.ok((copy.match(CLAIMS[name]) || []).length > 0, `${name} should catch "${copy}"`);
  }
});
