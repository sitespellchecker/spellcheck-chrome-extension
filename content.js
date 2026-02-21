// Site Spell Checker - Using Typo.js with Hunspell dictionaries
let dictionary = null;
let isChecking = false;

// Load dictionary using Typo.js with timeout
async function loadDictionary() {
  if (dictionary) return true;
  
  try {
    // Check if Typo is available
    if (typeof Typo === 'undefined') {
      console.error('Typo.js not loaded');
      return false;
    }
    
    // Load aff and dic files with timeout
    const DICT_TIMEOUT = 10000; // 10 seconds
    
    const loadWithTimeout = async () => {
      const affUrl = chrome.runtime.getURL('lib/en_US.aff');
      const dicUrl = chrome.runtime.getURL('lib/en_US.dic');
      
      const [affResponse, dicResponse] = await Promise.all([
        fetch(affUrl),
        fetch(dicUrl)
      ]);
      
      if (!affResponse.ok || !dicResponse.ok) {
        throw new Error('Dictionary files not found');
      }
      
      const affData = await affResponse.text();
      const dicData = await dicResponse.text();
      
      // Initialize Typo with loaded data
      dictionary = new Typo('en_US', affData, dicData);
      return true;
    };
    
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Dictionary loading timed out')), DICT_TIMEOUT)
    );
    
    const result = await Promise.race([loadWithTimeout(), timeout]);
    console.log('Typo dictionary loaded successfully');
    return result;
    
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return false;
  }
}

// Check if word is valid using Typo.js
function isValidWord(word) {
  // Skip short words
  if (word.length < 3) return true;
  
  // Skip numbers
  if (/^[0-9]+$/.test(word)) return true;
  
  // Skip all-caps (acronyms)
  if (/^[A-Z]{2,}$/.test(word)) return true;
  
  // Skip CamelCase (brand names, etc)
  if (/[a-z][A-Z]/.test(word)) return true;
  
  // Skip words with numbers (like i18n, a11y)
  if (/[a-zA-Z]+[0-9]+[a-zA-Z]*/.test(word)) return true;
  
  // If dictionary loaded, use Typo.js
  if (dictionary) {
    return dictionary.check(word);
  }
  
  // Fallback: assume valid if no dictionary
  return true;
}

// Get suggestions using Typo.js
function getSuggestions(word) {
  if (!dictionary) return [];
  
  const suggestions = dictionary.suggest(word);
  return suggestions.slice(0, 3);
}

// Collect all text nodes efficiently
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

// Main spell check function
async function checkSpelling() {
  if (isChecking) {
    return { success: false, error: 'Already checking', errors: [] };
  }
  
  isChecking = true;
  
  try {
    // Load dictionary first
    const dictLoaded = await loadDictionary();
    console.log(`Dictionary ready: ${dictLoaded}`);
    
    const errors = [];
    const seenWords = new Set();
    
    // Collect all text nodes
    const textNodes = collectTextNodes();
    console.log(`Found ${textNodes.length} text nodes to check`);
    
    // Process in chunks to avoid blocking UI
    const CHUNK_SIZE = 50;
    const MAX_ERRORS = 50;
    const MAX_WORDS = 3000;
    let wordCount = 0;
    
    for (let i = 0; i < textNodes.length && wordCount < MAX_WORDS; i += CHUNK_SIZE) {
      const chunk = textNodes.slice(i, i + CHUNK_SIZE);
      
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
      
      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    console.log(`Found ${errors.length} errors in ${wordCount} words`);
    
    // Apply highlights
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
        console.log('Could not highlight:', err.word);
      }
    });
    
    // Store results
    chrome.storage.session?.set({
      [`spellcheck_results_${window.location.href}`]: {
        errors: errors.map(e => ({ word: e.word, context: e.context, suggestions: e.suggestions })),
        timestamp: Date.now(),
        url: window.location.href
      }
    });
    
    return { 
      success: true, 
      errors: errors.map(e => ({ word: e.word, context: e.context, suggestions: e.suggestions })) 
    };
    
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

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'check') {
    checkSpelling()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message, errors: [] }));
    return true;
  } else if (request.action === 'clear') {
    clearHighlights();
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      success: true, 
      isChecking, 
      dictionaryLoaded: !!dictionary
    });
  }
});

// Preload dictionary on script load
loadDictionary().then(loaded => {
  console.log('Dictionary preloaded:', loaded);
});

console.log('Site Spell Checker content script loaded with Typo.js');
