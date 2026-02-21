// Site Spellchecker with full dictionary support
let dictionary = null;
let dictionaryLoaded = false;

// Common misspellings for quick lookup
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
  'commitment': 'commitment',
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
  'perseverance': 'perseverance',
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
  'tommorrow': 'tomorrow',
  'unfortunatly': 'unfortunately'
};

// Load dictionary from files
async function loadDictionary() {
  if (dictionaryLoaded) return dictionary !== null;
  
  try {
    const affUrl = chrome.runtime.getURL('lib/en_US.aff');
    const dicUrl = chrome.runtime.getURL('lib/en_US.dic');
    
    const [affResponse, dicResponse] = await Promise.all([
      fetch(affUrl),
      fetch(dicUrl)
    ]);
    
    if (!affResponse.ok || !dicResponse.ok) {
      console.log('Dictionary files not found, using fallback');
      dictionaryLoaded = true;
      return false;
    }
    
    const affData = await affResponse.text();
    const dicData = await dicResponse.text();
    
    // Parse dictionary words
    dictionary = new Set();
    const lines = dicData.split('\n');
    
    // Skip header line and parse words
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Word format: word/flags or just word
        const word = line.split('/')[0].split('\t')[0].toLowerCase();
        if (word) dictionary.add(word);
      }
    }
    
    console.log(`Loaded dictionary with ${dictionary.size} words`);
    dictionaryLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    dictionaryLoaded = true;
    return false;
  }
}

// Check if word is valid
function isValidWord(word) {
  // Skip short words
  if (word.length < 3) return true;
  
  // Skip numbers
  if (/^[0-9]+$/.test(word)) return true;
  
  // Skip all-caps (acronyms)
  if (/^[A-Z]{2,}$/.test(word)) return true;
  
  // Skip CamelCase
  if (/[a-z][A-Z]/.test(word)) return true;
  
  const lower = word.toLowerCase();
  
  // Check misspellings list
  if (MISSPELLINGS[lower]) return false;
  
  // If dictionary is loaded, use it
  if (dictionary && dictionary.size > 0) {
    // Check exact match
    if (dictionary.has(lower)) return true;
    
    // Check common variations
    // Try removing trailing 's' for plurals
    if (lower.endsWith('s')) {
      if (dictionary.has(lower.slice(0, -1))) return true;
      if (lower.endsWith('es') && dictionary.has(lower.slice(0, -2))) return true;
      if (lower.endsWith('ies') && dictionary.has(lower.slice(0, -3) + 'y')) return true;
    }
    
    // Try removing 'ing'
    if (lower.endsWith('ing')) {
      if (dictionary.has(lower.slice(0, -3))) return true;
      if (dictionary.has(lower.slice(0, -3) + 'e')) return true;
    }
    
    // Try removing 'ed'
    if (lower.endsWith('ed')) {
      if (dictionary.has(lower.slice(0, -2))) return true;
      if (dictionary.has(lower.slice(0, -3))) return true;
    }
    
    // Try removing 'ly'
    if (lower.endsWith('ly') && dictionary.has(lower.slice(0, -2))) return true;
    
    // Try removing 'er'/'est'
    if (lower.endsWith('er') && dictionary.has(lower.slice(0, -2))) return true;
    if (lower.endsWith('est') && dictionary.has(lower.slice(0, -3))) return true;
    
    // Not in dictionary - likely a typo
    return false;
  }
  
  // Fallback: check for obvious typos
  if (/[aeiou]{4,}/i.test(word)) return false;
  if (/[^aeiouy]{5,}/i.test(word)) return false;
  if (/([a-z])\1{2,}/i.test(word)) return false;
  if (/q[^u]/i.test(word)) return false;
  if (!/[aeiouy]/i.test(word)) return false;
  
  return true;
}

// Get suggestions for a misspelled word
function getSuggestions(word) {
  const lower = word.toLowerCase();
  const suggestions = [];
  
  // Check misspellings database
  if (MISSPELLINGS[lower]) {
    suggestions.push(MISSPELLINGS[lower]);
  }
  
  // If dictionary is loaded, find similar words
  if (dictionary && dictionary.size > 0) {
    // Simple edit distance - try common corrections
    const candidates = [
      lower + 'e',      // add 'e'
      lower.slice(0, -1), // remove last char
      lower.slice(0, -1) + 'e', // replace last with 'e'
      lower.replace(/ie$/, 'ei'), // ie -> ei
      lower.replace(/ei$/, 'ie'), // ei -> ie
      lower.replace(/ing$/, 'e'), // ing -> e
      lower + 'ing',    // add ing
      lower + 'ed',     // add ed
      lower.slice(0, -1) + 'ed', // change to ed
    ];
    
    for (const candidate of candidates) {
      if (dictionary.has(candidate) && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
        if (suggestions.length >= 3) break;
      }
    }
  }
  
  return suggestions.slice(0, 3);
}

// Main spell check function
async function checkSpelling() {
  // Load dictionary first
  const hasDictionary = await loadDictionary();
  console.log(`Dictionary loaded: ${hasDictionary} (${dictionary ? dictionary.size : 0} words)`);
  
  const errors = [];
  const seenWords = new Set();
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const tag = parent.tagName;
        if (['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA','INPUT'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        if (parent.classList?.contains('spellcheck-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  // Process words
  let count = 0;
  const maxWords = 2000;
  
  textNodes.forEach(textNode => {
    if (count >= maxWords) return;
    
    const text = textNode.textContent;
    const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
    
    words.forEach(word => {
      if (count >= maxWords) return;
      count++;
      
      const lower = word.toLowerCase();
      if (seenWords.has(lower)) return;
      seenWords.add(lower);
      
      if (!isValidWord(word)) {
        const index = text.indexOf(word);
        
        if (index !== -1) {
          const before = text.substring(Math.max(0, index - 12), index);
          const after = text.substring(index + word.length, index + word.length + 12);
          const suggestions = getSuggestions(word);
          
          errors.push({
            word,
            context: (before ? '...' : '') + before + word + after + (after ? '...' : ''),
            suggestions
          });
          
          try {
            const range = document.createRange();
            range.setStart(textNode, index);
            range.setEnd(textNode, index + word.length);
            
            const span = document.createElement('span');
            span.className = 'spellcheck-highlight';
            span.textContent = word;
            
            if (suggestions.length > 0) {
              span.title = `Did you mean: ${suggestions.join(', ')}?`;
            } else {
              span.title = 'Possible typo';
            }
            
            range.deleteContents();
            range.insertNode(span);
          } catch (e) {
            // Range might be invalid
          }
        }
      }
    });
  });

  return errors;
}

// Clear all highlights
function clearHighlights() {
  document.querySelectorAll('.spellcheck-highlight').forEach(el => {
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
      .then(errors => {
        sendResponse({ success: true, errors });
      })
      .catch(error => {
        console.error('Spell check error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async
  } else if (request.action === 'clear') {
    clearHighlights();
    sendResponse({ success: true });
  }
});

console.log('Site Spellchecker content script loaded');
