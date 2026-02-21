// Site Spellchecker - Performance-Optimized Content Script
let dictionary = null;
let typoInstance = null;
let dictionaryLoaded = false;
let isChecking = false;

// Common misspellings for quick lookup (keep in memory, small)
const COMMON_WORDS = new Set([
  // Common UI/tech words that might not be in dictionary
  'input', 'output', 'reload', 'refresh', 'dismiss', 'profile', 'account',
  'settings', 'options', 'preferences', 'config', 'configuration',
  'username', 'password', 'email', 'login', 'logout', 'signup', 'signin',
  'dashboard', 'admin', 'user', 'administrator', 'moderator',
  'api', 'url', 'uri', 'http', 'https', 'www', 'web', 'internet',
  'server', 'client', 'database', 'db', 'query', 'request', 'response',
  'frontend', 'backend', 'fullstack', 'webpage', 'website', 'homepage',
  'javascript', 'js', 'typescript', 'ts', 'html', 'css', 'json', 'xml',
  'browser', 'chrome', 'firefox', 'safari', 'edge', 'opera',
  'click', 'hover', 'focus', 'blur', 'scroll', 'resize', 'drag', 'drop',
  'menu', 'nav', 'navigation', 'sidebar', 'header', 'footer', 'section',
  'button', 'link', 'href', 'src', 'alt', 'title', 'class', 'id',
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a',
  'form', 'input', 'select', 'option', 'textarea', 'label', 'submit',
  'modal', 'popup', 'dialog', 'alert', 'confirm', 'prompt',
  'loading', 'loader', 'spinner', 'progress', 'skeleton',
  'success', 'error', 'warning', 'info', 'notice', 'message',
  'search', 'filter', 'sort', 'order', 'pagination', 'page',
  'grid', 'list', 'table', 'card', 'item', 'row', 'column',
  'show', 'hide', 'visible', 'hidden', 'collapse', 'expand',
  'enable', 'disable', 'enabled', 'disabled', 'active', 'inactive',
  'required', 'optional', 'mandatory', 'default', 'custom',
  'new', 'old', 'create', 'edit', 'update', 'delete', 'remove', 'save',
  'add', 'remove', 'clear', 'reset', 'cancel', 'close', 'open',
  'back', 'next', 'previous', 'first', 'last', 'more', 'less',
  'up', 'down', 'left', 'right', 'top', 'bottom', 'center',
  'true', 'false', 'yes', 'no', 'on', 'off', 'null', 'undefined',
  'loading', 'saving', 'uploading', 'downloading', 'processing',
  'select', 'selected', 'unselect', 'deselect', 'multi', 'single',
  'copy', 'paste', 'cut', 'delete', 'undo', 'redo',
  'zoom', 'scale', 'resize', 'fullscreen', 'maximize', 'minimize',
  'print', 'export', 'import', 'download', 'upload', 'attach',
  'share', 'embed', 'code', 'preview', 'view', 'edit',
  'description', 'summary', 'detail', 'details', 'meta', 'tag',
  'category', 'categories', 'type', 'types', 'status', 'state',
  'version', 'edition', 'release', 'update', 'upgrade', 'changelog',
  'doc', 'docs', 'documentation', 'manual', 'guide', 'tutorial',
  'faq', 'help', 'support', 'contact', 'about', 'home',
  'blog', 'news', 'article', 'post', 'comment', 'review',
  'product', 'service', 'pricing', 'plan', 'subscription',
  'cart', 'checkout', 'payment', 'billing', 'invoice', 'order',
  'wishlist', 'favorite', 'bookmark', 'saved', 'recent',
  'notification', 'alert', 'badge', 'indicator', 'counter',
  'avatar', 'picture', 'photo', 'image', 'icon', 'logo',
  'banner', 'hero', 'carousel', 'slider', 'slideshow',
  'tab', 'tabs', 'accordion', 'collapsible', 'toggle',
  'dropdown', 'combobox', 'autocomplete', 'typeahead',
  'datepicker', 'calendar', 'clock', 'timer', 'countdown',
  'chart', 'graph', 'map', 'video', 'audio', 'player',
  'lightbox', 'gallery', 'thumbnail', 'preview',
  'breadcrumb', 'pagination', 'pager', 'navigator',
  'toolbar', 'tool', 'action', 'actions', 'operation', 'operations',
  'plugin', 'widget', 'component', 'module', 'extension',
  'theme', 'skin', 'style', 'stylesheet', 'layout', 'template',
  'cookie', 'cache', 'session', 'local', 'storage', 'memory',
  'encrypt', 'decrypt', 'hash', 'token', 'auth', 'oauth',
  'verify', 'validation', 'validate', 'sanitize', 'escape',
  'encode', 'decode', 'compress', 'decompress', 'minify',
  'debug', 'debugging', 'debugger', 'console', 'log', 'trace',
  'error', 'exception', 'throw', 'catch', 'try', 'finally',
  'async', 'await', 'promise', 'callback', 'event', 'listener',
  'function', 'method', 'property', 'attribute', 'variable',
  'constant', 'let', 'const', 'var', 'class', 'object', 'array',
  'string', 'number', 'boolean', 'integer', 'float', 'double',
  'date', 'time', 'datetime', 'timestamp', 'timezone',
  'stringify', 'parse', 'serialize', 'deserialize',
  'clone', 'copy', 'deep', 'shallow', 'merge', 'assign',
  'sort', 'filter', 'map', 'reduce', 'foreach', 'for', 'while',
  'if', 'else', 'switch', 'case', 'break', 'continue', 'return',
  'import', 'export', 'default', 'from', 'as', 'require',
  'module', 'namespace', 'package', 'library', 'framework',
  'git', 'github', 'gitlab', 'bitbucket', 'svn', 'version',
  'branch', 'commit', 'push', 'pull', 'merge', 'rebase',
  'deploy', 'deployment', 'build', 'compile', 'bundle',
  'dev', 'prod', 'staging', 'test', 'testing', 'qa',
  'localhost', 'server', 'host', 'port', 'ip', 'domain',
  'dns', 'cdn', 'ssl', 'tls', 'https', 'cert', 'certificate',
  'firewall', 'proxy', 'vpn', 'ssh', 'ftp', 'sftp',
  'docker', 'container', 'image', 'volume', 'network',
  'kubernetes', 'k8s', 'pod', 'service', 'deployment',
  'aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda',
  'database', 'sql', 'nosql', 'mongo', 'mysql', 'postgres',
  'redis', 'cache', 'queue', 'message', 'pubsub',
  'json', 'yaml', 'yml', 'xml', 'csv', 'tsv', 'sql',
  'markdown', 'md', 'txt', 'text', 'html', 'htm',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico',
  'mp3', 'mp4', 'wav', 'ogg', 'webm', 'avi', 'mov',
  'zip', 'tar', 'gz', 'gzip', 'rar', '7z', 'bz2',
  'plugin', 'addon', 'extension', 'app', 'application',
  'software', 'program', 'code', 'source', 'repo', 'repository',
  'issue', 'bug', 'feature', 'milestone', 'release', 'tag',
  'wiki', 'readme', 'license', 'copyright', 'trademark',
  'privacy', 'policy', 'terms', 'conditions', 'agreement',
  'tos', 'eula', 'gdpr', 'ccpa', 'hipaa', 'pci', 'soc2',
  // Marketing/business terms
  'cta', 'conversion', 'funnel', 'landing', 'campaign',
  'analytics', 'tracking', 'metrics', 'kpi', 'roi',
  'ab', 'test', 'split', 'variant', 'experiment',
  'seo', 'sem', 'ppc', 'cpc', 'cpm', 'ctr', 'cpa',
  'lead', 'prospect', 'customer', 'client', 'user',
  'engagement', 'retention', 'churn', 'acquisition',
  'monetization', 'revenue', 'profit', 'margin',
  'b2b', 'b2c', 'saas', 'paas', 'iaas', 'daas',
  'startup', 'enterprise', 'smb', 'midmarket',
  'onboarding', 'activation', 'adoption', 'usage',
  'feedback', 'survey', 'nps', 'csat', 'rating',
  'review', 'testimonial', 'case', 'study', 'whitepaper',
  'webinar', 'demo', 'trial', 'freemium', 'upgrade',
  'renewal', 'cancellation', 'refund', 'support',
  'helpdesk', 'ticketing', 'kb', 'knowledgebase',
  'community', 'forum', 'discussion', 'chat', 'livechat',
  'bot', 'ai', 'ml', 'nlp', 'automation', 'workflow',
  'integration', 'api', 'webhook', 'sdk', 'cli',
  'rest', 'graphql', 'grpc', 'soap', 'rpc', 'socket',
  'websocket', 'sse', 'polling', 'streaming',
  'jsonp', 'cors', 'csrf', 'xss', 'sqli', 'injection',
  'authentication', 'authorization', 'permission',
  'role', 'group', 'team', 'organization', 'workspace',
  'invite', 'collaboration', 'sharing', 'permission',
  'access', 'control', 'acl', 'rbac', 'policy',
  'encryption', 'hashing', 'salting', 'peppering',
  'key', 'secret', 'credential', 'password', 'passphrase',
  'token', 'jwt', 'oauth', 'oidc', 'saml', 'sso',
  'mfa', '2fa', 'otp', 'totp', 'backup', 'recovery',
  'security', 'compliance', 'audit', 'logging', 'monitoring',
  'alerting', 'notification', 'incident', 'breach',
  'backup', 'restore', 'recovery', 'disaster', 'dr',
  'sla', 'uptime', 'availability', 'reliability',
  'performance', 'latency', 'throughput', 'bandwidth',
  'scalability', 'elasticity', 'resilience', 'redundancy',
  'failover', 'loadbalancer', 'cdn', 'edge', 'origin',
  'caching', 'cache', 'invalidation', 'ttl', 'expiry',
  'compression', 'minification', 'optimization',
  'bundle', 'chunk', 'asset', 'resource', 'static',
  'dynamic', 'ssr', 'csr', 'spa', 'mpa', 'pwa',
  'amp', 'instant', 'turbo', 'hotwire', 'htmx',
  'react', 'vue', 'angular', 'svelte', 'solid',
  'next', 'nuxt', 'remix', 'astro', 'eleventy',
  'jquery', 'lodash', 'moment', 'date', 'dayjs',
  'bootstrap', 'tailwind', 'bulma', 'foundation',
  'material', 'antd', 'chakra', 'mantine', 'radix',
  'styled', 'emotion', 'jss', 'cssinjs', 'sass', 'less',
  'postcss', 'autoprefixer', 'purge', 'treeshake',
  'webpack', 'vite', 'rollup', 'parcel', 'esbuild',
  'swc', 'turbopack', 'babel', 'typescript', 'ts',
  'eslint', 'prettier', 'stylelint', 'editorconfig',
  'husky', 'lintstaged', 'commitlint', 'semantic',
  'jest', 'vitest', 'mocha', 'chai', 'jasmine',
  'cypress', 'playwright', 'selenium', 'puppeteer',
  'storybook', 'chromatic', 'percy', 'backstop',
  'sentry', 'bugsnag', 'logrocket', 'datadog',
  'newrelic', 'dynatrace', 'appdynamics', 'splunk',
  'elastic', 'elk', 'kibana', 'grafana', 'prometheus',
  'datadog', 'honeycomb', 'lightstep', 'jaeger',
  'opentelemetry', 'otel', 'tracing', 'profiling',
  'apm', 'rum', 'synthetic', 'monitoring', 'observability'
]);

const MISSPELLINGS = {
  'proofreeding': 'proofreading',
  'realy': 'really',
  'truely': 'truly',
  'definately': 'definitely',
  'seperate': 'separate',
  'occured': 'occurred',
  'recieve': 'receive',
  'acheive': 'achieve',
  'beleive': 'believe',
  'calender': 'calendar',
  'collegue': 'colleague',
  'comming': 'coming',
  'concious': 'conscious',
  'curiousity': 'curiosity',
  'decieve': 'deceive',
  'dissapoint': 'disappoint',
  'embarass': 'embarrass',
  'existance': 'existence',
  'foriegn': 'foreign',
  'goverment': 'government',
  'grammer': 'grammar',
  'harrass': 'harass',
  'imediately': 'immediately',
  'independant': 'independent',
  'knowlege': 'knowledge',
  'liason': 'liaison',
  'millenium': 'millennium',
  'neccessary': 'necessary',
  'noticable': 'noticeable',
  'occassion': 'occasion',
  'occurence': 'occurrence',
  'paralell': 'parallel',
  'peice': 'piece',
  'posession': 'possession',
  'prefered': 'preferred',
  'proffesional': 'professional',
  'pronounciation': 'pronunciation',
  'publically': 'publicly',
  'recomend': 'recommend',
  'refering': 'referring',
  'relevent': 'relevant',
  'religous': 'religious',
  'repitition': 'repetition',
  'sence': 'sense',
  'seige': 'siege',
  'supercede': 'supersede',
  'suprise': 'surprise',
  'tommorow': 'tomorrow',
  'untill': 'until',
  'weild': 'wield',
  'whereever': 'wherever',
  'wierd': 'weird',
  'writting': 'writing',
  'accomodate': 'accommodate',
  'adress': 'address',
  'aggresive': 'aggressive',
  'alot': 'a lot',
  'amature': 'amateur',
  'apparant': 'apparent',
  'appearence': 'appearance',
  'arguement': 'argument',
  'basicly': 'basically',
  'beaurocracy': 'bureaucracy',
  'becomming': 'becoming',
  'begining': 'beginning',
  'belive': 'believe',
  'buisness': 'business',
  'catagory': 'category',
  'cemetary': 'cemetery',
  'changable': 'changeable',
  'cheif': 'chief',
  'commited': 'committed',
  'completly': 'completely',
  'copywrite': 'copyright',
  'desireable': 'desirable',
  'diarrea': 'diarrhea',
  'drunkeness': 'drunkenness',
  'equiped': 'equipped',
  'experiance': 'experience',
  'extreem': 'extreme',
  'facinating': 'fascinating',
  'firey': 'fiery',
  'freind': 'friend',
  'fullfil': 'fulfill',
  'heighth': 'height',
  'heirarchy': 'hierarchy',
  'humerous': 'humorous',
  'idiosyncracy': 'idiosyncrasy',
  'indispensible': 'indispensable',
  'innoculate': 'inoculate',
  'intresting': 'interesting',
  'irresistable': 'irresistible',
  'libary': 'library',
  'lightening': 'lightning',
  'maintainance': 'maintenance',
  'medeval': 'medieval',
  'miniture': 'miniature',
  'miniscule': 'minuscule',
  'mischevious': 'mischievous',
  'misspell': 'misspell',
  'nuisance': 'nuisance',
  'occurrance': 'occurrence',
  'pasttime': 'pastime',
  'pavillion': 'pavilion',
  'percieve': 'perceive',
  'persistance': 'persistence',
  'personel': 'personnel',
  'plagerize': 'plagiarize',
  'playright': 'playwright',
  'presance': 'presence',
  'priviledge': 'privilege',
  'probly': 'probably',
  'proffesor': 'professor',
  'promiss': 'promise',
  'propoganda': 'propaganda',
  'que': 'queue',
  'questionaire': 'questionnaire',
  'readible': 'readable',
  'referance': 'reference',
  'restaraunt': 'restaurant',
  'rhythem': 'rhythm',
  'rythm': 'rhythm',
  'sacreligious': 'sacrilegious',
  'sieze': 'seize',
  'siezing': 'seizing',
  'siezure': 'seizure',
  'sinse': 'since',
  'speach': 'speech',
  'stratagy': 'strategy',
  'sucessful': 'successful',
  'suround': 'surround',
  'synchronus': 'synchronous',
  'temperment': 'temperament',
  'tendancy': 'tendency',
  'theif': 'thief',
  'unfortunatly': 'unfortunately'
};

// Efficient dictionary cache
const DICTIONARY_CACHE_KEY = 'spellcheck_dictionary_cache';
const DICTIONARY_CACHE_VERSION = '1.0';

// Check if we have a cached dictionary
async function getCachedDictionary() {
  try {
    const result = await chrome.storage.local.get([DICTIONARY_CACHE_KEY]);
    const cached = result[DICTIONARY_CACHE_KEY];
    
    if (cached && cached.version === DICTIONARY_CACHE_VERSION) {
      console.log(`Using cached dictionary: ${cached.words.length} words`);
      return new Set(cached.words);
    }
  } catch (e) {
    console.log('No cached dictionary found');
  }
  return null;
}

// Cache dictionary for future use
async function cacheDictionary(words) {
  try {
    await chrome.storage.local.set({
      [DICTIONARY_CACHE_KEY]: {
        version: DICTIONARY_CACHE_VERSION,
        words: Array.from(words),
        timestamp: Date.now()
      }
    });
    console.log('Dictionary cached successfully');
  } catch (e) {
    console.error('Failed to cache dictionary:', e);
  }
}

// Load dictionary from files with caching
async function loadDictionary() {
  if (dictionaryLoaded) return dictionary !== null;
  
  // Check cache first
  const cached = await getCachedDictionary();
  if (cached) {
    dictionary = cached;
    dictionaryLoaded = true;
    return true;
  }
  
  try {
    const affUrl = chrome.runtime.getURL('lib/en_US.aff');
    const dicUrl = chrome.runtime.getURL('lib/en_US.dic');
    
    const [affResponse, dicResponse] = await Promise.all([
      fetch(affUrl),
      fetch(dicUrl)
    ]);
    
    if (!affResponse.ok || !dicResponse.ok) {
      console.log('Dictionary files not found');
      dictionaryLoaded = true;
      return false;
    }
    
    const dicData = await dicResponse.text();
    
    // Parse dictionary words efficiently
    dictionary = new Set();
    const lines = dicData.split('\n');
    
    // Skip header line (first line is count)
    const wordCount = parseInt(lines[0]) || lines.length - 1;
    
    for (let i = 1; i < lines.length && dictionary.size < wordCount; i++) {
      const line = lines[i].trim();
      if (line) {
        // Word format: word/flags or just word
        const word = line.split('/')[0].split('\t')[0].toLowerCase();
        if (word) dictionary.add(word);
      }
    }
    
    console.log(`Loaded dictionary with ${dictionary.size} words`);
    
    // Cache for next time
    await cacheDictionary(dictionary);
    
    dictionaryLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    dictionaryLoaded = true;
    return false;
  }
}

// Check if word is valid using multiple strategies
function isValidWord(word) {
  // Skip short words
  if (word.length < 3) return true;
  
  // Skip numbers
  if (/^[0-9]+$/.test(word)) return true;
  
  // Skip all-caps (acronyms)
  if (/^[A-Z]{2,}$/.test(word)) return true;
  
  // Skip CamelCase (brand names, etc)
  if (/[a-z][A-Z]/.test(word)) return true;
  
  const lower = word.toLowerCase();
  
  // Check common tech/UI words first (fast whitelist)
  if (COMMON_WORDS.has(lower)) return true;
  
  // Check common misspellings (fast)
  if (MISSPELLINGS[lower]) return false;
  
  // If dictionary is loaded, use it
  if (dictionary && dictionary.size > 0) {
    // Check exact match
    if (dictionary.has(lower)) return true;
    
    // Check common variations with regex patterns
    // Plurals ending in 's'
    if (lower.endsWith('s')) {
      if (dictionary.has(lower.slice(0, -1))) return true;
      if (lower.endsWith('es') && dictionary.has(lower.slice(0, -2))) return true;
      if (lower.endsWith('ies') && dictionary.has(lower.slice(0, -3) + 'y')) return true;
    }
    
    // Past tense/participle
    if (lower.endsWith('ed')) {
      if (dictionary.has(lower.slice(0, -2))) return true;
      if (lower.endsWith('ied') && dictionary.has(lower.slice(0, -3) + 'y')) return true;
    }
    
    // Present participle
    if (lower.endsWith('ing')) {
      if (dictionary.has(lower.slice(0, -3))) return true;
      if (dictionary.has(lower.slice(0, -3) + 'e')) return true;
    }
    
    // Adverbs
    if (lower.endsWith('ly') && dictionary.has(lower.slice(0, -2))) return true;
    
    // Comparative/superlative
    if (lower.endsWith('er') && dictionary.has(lower.slice(0, -2))) return true;
    if (lower.endsWith('est') && dictionary.has(lower.slice(0, -3))) return true;
    
    // Not in dictionary - likely misspelled
    return false;
  }
  
  // Fallback: basic pattern checks when no dictionary
  // Too many vowels in a row
  if (/[aeiou]{4,}/i.test(word)) return false;
  // Too many consonants in a row
  if (/[^aeiouy]{6,}/i.test(word)) return false;
  // Repeated characters
  if (/([a-z])\1{2,}/i.test(word)) return false;
  // Q not followed by u
  if (/q[^u]/i.test(word)) return false;
  // No vowels at all
  if (!/[aeiouy]/i.test(word)) return false;
  
  return true;
}

// Get suggestions for a misspelled word
function getSuggestions(word) {
  const lower = word.toLowerCase();
  const suggestions = [];
  
  // Check misspellings database first (fast)
  if (MISSPELLINGS[lower]) {
    suggestions.push(MISSPELLINGS[lower]);
  }
  
  // If dictionary is loaded, find similar words
  if (dictionary && dictionary.size > 0) {
    // Common edit patterns
    const candidates = [];
    
    // Add/remove 'e'
    if (lower.endsWith('e')) {
      candidates.push(lower.slice(0, -1));
    } else {
      candidates.push(lower + 'e');
    }
    
    // ie/ei swap
    if (lower.includes('ie')) {
      candidates.push(lower.replace(/ie/g, 'ei'));
    }
    if (lower.includes('ei')) {
      candidates.push(lower.replace(/ei/g, 'ie'));
    }
    
    // Double letter variations
    candidates.push(lower.replace(/([a-z])\1/g, '$1'));
    
    // Common suffix changes
    if (lower.endsWith('ing')) {
      candidates.push(lower.slice(0, -3));
      candidates.push(lower.slice(0, -3) + 'e');
    }
    if (lower.endsWith('ed')) {
      candidates.push(lower.slice(0, -2));
    }
    
    // Check which candidates are in dictionary
    for (const candidate of candidates) {
      if (dictionary.has(candidate) && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
        if (suggestions.length >= 3) break;
      }
    }
  }
  
  return suggestions.slice(0, 3);
}

// Collect all text nodes efficiently (without modifying during iteration)
function collectTextNodes() {
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        // Skip script/style/code elements
        const tag = parent.tagName;
        if (['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA','INPUT','SELECT'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip already highlighted elements
        if (parent.classList?.contains('spellcheck-highlight') || 
            parent.closest?.('.spellcheck-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip empty text
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  return textNodes;
}

// Main spell check function - optimized
async function checkSpelling() {
  if (isChecking) {
    return { success: false, error: 'Already checking', errors: [] };
  }
  
  isChecking = true;
  
  try {
    // Load dictionary first (cached)
    const hasDictionary = await loadDictionary();
    console.log(`Dictionary ready: ${hasDictionary}, ${dictionary ? dictionary.size : 0} words`);
    
    const errors = [];
    const seenWords = new Set();
    
    // Collect all text nodes first (don't modify while iterating)
    const textNodes = collectTextNodes();
    console.log(`Found ${textNodes.length} text nodes to check`);
    
    // Process in chunks to avoid blocking UI
    const CHUNK_SIZE = 100;
    const MAX_ERRORS = 100;
    const MAX_WORDS = 5000;
    let wordCount = 0;
    
    for (let i = 0; i < textNodes.length && wordCount < MAX_WORDS; i += CHUNK_SIZE) {
      const chunk = textNodes.slice(i, i + CHUNK_SIZE);
      
      // Process this chunk
      chunk.forEach(textNode => {
        if (wordCount >= MAX_WORDS || errors.length >= MAX_ERRORS) return;
        
        const text = textNode.textContent;
        // Match words with 3+ letters
        const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
        
        words.forEach(word => {
          if (wordCount >= MAX_WORDS || errors.length >= MAX_ERRORS) return;
          wordCount++;
          
          const lower = word.toLowerCase();
          if (seenWords.has(lower)) return;
          seenWords.add(lower);
          
          if (!isValidWord(word)) {
            const index = text.indexOf(word);
            if (index !== -1) {
              const before = text.substring(Math.max(0, index - 15), index);
              const after = text.substring(index + word.length, index + word.length + 15);
              const suggestions = getSuggestions(word);
              
              errors.push({
                word,
                context: (before ? '...' : '') + before + word + after + (after ? '...' : ''),
                suggestions,
                textNode,
                index,
                wordLength: word.length
              });
            }
          }
        });
      });
      
      // Yield to event loop every chunk
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    console.log(`Found ${errors.length} errors in ${wordCount} words`);
    
    // Now apply highlights (after collection is complete)
    errors.forEach(err => {
      try {
        const { textNode, index, wordLength } = err;
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + wordLength);
        
        const span = document.createElement('span');
        span.className = 'spellcheck-highlight';
        span.textContent = err.word;
        
        if (err.suggestions.length > 0) {
          span.title = `Did you mean: ${err.suggestions.join(', ')}?`;
        } else {
          span.title = 'Possible typo';
        }
        
        range.deleteContents();
        range.insertNode(span);
      } catch (e) {
        // Range might be invalid, skip this error
        console.log('Could not highlight:', err.word);
      }
    });
    
    // Store results for popup
    chrome.storage.session?.set({
      [`spellcheck_results_${window.location.href}`]: {
        errors: errors.map(e => ({ word: e.word, context: e.context, suggestions: e.suggestions })),
        timestamp: Date.now(),
        url: window.location.href
      }
    });
    
    return { success: true, errors: errors.map(e => ({ word: e.word, context: e.context, suggestions: e.suggestions })) };
    
  } catch (error) {
    console.error('Spell check error:', error);
    return { success: false, error: error.message, errors: [] };
  } finally {
    isChecking = false;
  }
}

// Clear all highlights
function clearHighlights() {
  const highlights = document.querySelectorAll('.spellcheck-highlight');
  highlights.forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.insertBefore(document.createTextNode(el.textContent), el);
      parent.removeChild(el);
      parent.normalize();
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'check') {
    checkSpelling()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message, errors: [] }));
    return true; // Keep channel open for async
  } else if (request.action === 'clear') {
    clearHighlights();
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      success: true, 
      isChecking, 
      dictionaryLoaded,
      dictionarySize: dictionary?.size || 0
    });
  }
});

console.log('Site Spellchecker content script loaded (optimized)');
