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
  // The approved set itself (#1, Copilot): documenting a new permission is not approval.
  assert.deepEqual([...manifest.permissions].sort(), ['activeTab', 'scripting', 'storage'], 'only activeTab, scripting and storage are approved');
  assert.equal(manifest.optional_permissions, undefined, 'no optional_permissions');
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

// Compare the parsed origin exactly: a prefix check would accept sitespellchecker.com.example.org
// or sitespellchecker.com@example.org. Template-literal placeholders (${...}) are cut off first.
const ALLOWED_ORIGIN = 'https://sitespellchecker.com';
function assertAllowedUrl(raw, file) {
  const url = raw.split('${')[0];
  let origin = null;
  try {
    const parsed = new URL(url);
    origin = parsed.username || parsed.password ? null : parsed.origin;
  } catch {
    origin = null;
  }
  assert.equal(origin, ALLOWED_ORIGIN, `${file}: unexpected URL ${raw}`);
}

test('the URL check rejects look-alike hosts', () => {
  for (const bad of ['https://sitespellchecker.com.example.org/collect', 'https://sitespellchecker.com@example.org/collect', 'http://sitespellchecker.com/', 'https://evil.com/?https://sitespellchecker.com']) {
    assert.throws(() => assertAllowedUrl(bad, 'test'), undefined, bad);
  }
  assertAllowedUrl('https://sitespellchecker.com/site-scans/checkout?domain=${x}', 'test');
});

// PRIVACY.md: "We collect nothing", no automatic network requests, page content never leaves the
// browser. The only outbound link is the user-clicked upsell to sitespellchecker.com, so a remote URL
// may appear only on that link, and fetch() may only load the bundled dictionary files.
const BUNDLED_FILE = /^chrome\.runtime\.getURL\(\s*['"]lib\/[\w.-]+['"]\s*\)$/;
function networkOffenders(file, code) {
  const offenders = [];
  if (/sendBeacon\(|new XMLHttpRequest|new Image\(|new WebSocket|new EventSource|\b(?:gtag|mixpanel|posthog)\(|umami\.|plausible\(|google-analytics\.com|googletagmanager\.com|importScripts\(\s*['"]https?:/.test(code)) {
    offenders.push(`${file}: phones home`);
  }
  for (const line of code.split('\n')) {
    for (const url of line.match(/https?:\/\/[^\s'"`)]+/g) || []) {
      try {
        assertAllowedUrl(url, file);
      } catch {
        offenders.push(`${file}: unexpected URL ${url}`);
        continue;
      }
      const upsell = file === 'popup.html' ? /\bid="upsellLink"/.test(line) : file === 'popup.js' && /^\s*upsellLink\.href\s*=/.test(line);
      if (!upsell) offenders.push(`${file}: ${url} outside the user-clicked upsell link`);
    }
  }
  for (const call of code.matchAll(/\bfetch\(\s*([^,)]+)/g)) {
    const arg = call[1].trim();
    if (/^e\.data\.\w+$/.test(arg) && file === 'lib/dict-worker.js' && !packaged.has(file)) continue; // unused, not shipped
    if (!/^[A-Za-z_$][\w$]*$/.test(arg)) {
      offenders.push(`${file}: fetch(${arg}) must take a variable set to a bundled file`);
      continue;
    }
    const assignments = [...code.matchAll(new RegExp(`(?<![\\w$.])${arg.replace(/\$/g, '\\$')}\\s*=(?!=)\\s*([^;\\n]+)`, 'g'))].map((m) => m[1].trim());
    // A parameter (or destructured/loop binding) with the same name shadows the bundled-file
    // variable, and its value can't be checked statically (#1, Copilot): reject it.
    const name = arg.replace(/\$/g, '\\$');
    const shadowed = new RegExp(`(?:function\\b[^(]*\\(|\\(|,)\\s*[^()]*\\b${name}\\b[^()]*\\)\\s*(?:=>|\\{)|\\b${name}\\s*=>|\\b(?:for\\s*\\(\\s*(?:const|let|var)\\s+${name}\\b|catch\\s*\\(\\s*${name}\\b)`).test(code);
    if (shadowed) {
      offenders.push(`${file}: fetch(${arg}) argument is also a parameter or loop binding; use a uniquely named bundled-file variable`);
      continue;
    }
    if (!assignments.length || assignments.some((value) => !BUNDLED_FILE.test(value))) {
      offenders.push(`${file}: fetch(${arg}) must load a bundled lib/ file, got ${assignments.join(' | ') || 'no assignment'}`);
    }
  }
  return offenders;
}

test('the extension makes no network requests and has no tracking', () => {
  const offenders = [];
  for (const file of ['content.js', 'popup.js', 'popup.html', 'lib/dict-worker.js']) {
    offenders.push(...networkOffenders(file, read(file)));
  }
  assert.deepEqual(offenders, []);
});

test('the network check catches remote fetches and stray URLs (proof the check works)', () => {
  const content = read('content.js');
  const remote = content.replace(/const affUrl = [^;]+;/, "const affUrl = 'https://sitespellchecker.com/collect';");
  assert.notEqual(remote, content, 'content.js still assigns affUrl');
  assert.notDeepEqual(networkOffenders('content.js', remote), []);
  assert.notDeepEqual(networkOffenders('content.js', `${content}\nfetch('https://sitespellchecker.com/collect');`), []);
  assert.notDeepEqual(networkOffenders('content.js', `${content}\nconst ping = 'https://sitespellchecker.com/collect';`), []);
  assert.notDeepEqual(networkOffenders('popup.js', `${read('popup.js')}\nconst affUrl = chrome.runtime.getURL('lib/en_US.aff');\nfetch(affUrl);\naffUrl = 'https://x.example/';`), []);
  const shadow = "const affUrl = chrome.runtime.getURL('lib/en_US.aff');\nfunction load(affUrl) { return fetch(affUrl); }\nload(window.location.href);";
  assert.notDeepEqual(networkOffenders('content.js', shadow), [], 'shadowed parameter');
  assert.notDeepEqual(networkOffenders('content.js', "const affUrl = chrome.runtime.getURL('lib/en_US.aff');\nconst load = (affUrl) => fetch(affUrl);"), [], 'shadowed arrow parameter');
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

// The extension checks spelling only (Typo.js with an en_US dictionary). The popup used to promise
// "grammar mistakes, and more" (ops decision 2026-10-17: say spelling). Don't claim grammar checking.
test('user-facing copy describes spell checking, not grammar checking', () => {
  const sources = { 'README.md': read('README.md'), 'popup.html': read('popup.html'), 'manifest.json': `${manifest.name} ${manifest.description}`, 'package.json': read('package.json') };
  for (const [file, text] of Object.entries(sources)) {
    assert.doesNotMatch(text, /\bgrammar|\bgrammatical|\band more\b/i, `${file} claims more than spell checking`);
  }
  assert.match(read('popup.html'), /\bspelling\b/i, 'the popup says what it checks: spelling');
});
