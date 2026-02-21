// Popup script with loading states and better UX
let currentResults = null;
let currentUrl = null;

// Get current tab info
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      return {
        domain: new URL(tab.url).hostname.replace(/^www\./, ''),
        fullUrl: tab.url,
        tabId: tab.id
      };
    }
  } catch (e) {
    console.log('Could not get tab info:', e);
  }
  return null;
}

// Check for cached results
async function loadCachedResults() {
  const current = await getCurrentTab();
  if (!current) return false;
  
  try {
    const key = `spellcheck_results_${current.fullUrl}`;
    const result = await chrome.storage.session.get([key]);
    const cached = result[key];
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
      currentResults = cached.errors;
      currentUrl = current.fullUrl;
      return true;
    }
  } catch (e) {
    console.log('No cached results');
  }
  return false;
}

// Escape HTML for display
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Display results in UI
function displayResults(errors) {
  const resultsDiv = document.getElementById('results');
  
  if (errors.length === 0) {
    resultsDiv.innerHTML = `
      <div class="success-message">
        <span class="success-icon">✓</span>
        <p>No spelling errors found!</p>
      </div>
    `;
    return;
  }

  // Show first 15 errors
  const displayErrors = errors.slice(0, 15);
  const errorList = displayErrors.map(err => {
    const suggestions = err.suggestions?.length 
      ? `<div class="suggestions">Did you mean: ${err.suggestions.map(s => `<span class="suggestion">${escapeHtml(s)}</span>`).join(', ')}</div>`
      : '';
    
    return `
      <li class="error-item">
        <div class="error-header">
          <span class="error-word">${escapeHtml(err.word)}</span>
        </div>
        <span class="error-context">${escapeHtml(err.context)}</span>
        ${suggestions}
      </li>
    `;
  }).join('');

  const more = errors.length > 15 
    ? `<p class="more-errors">...and ${errors.length - 15} more errors on this page</p>` 
    : '';

  resultsDiv.innerHTML = `
    <div class="error-count">${errors.length} error${errors.length !== 1 ? 's' : ''} found</div>
    <ul class="error-list">${errorList}</ul>
    ${more}
  `;
}

// Show loading state
function showLoading(message = 'Loading dictionary...') {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

// Show error state
function showError(message) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = `
    <div class="error-message">
      <span class="error-icon">⚠</span>
      <p>${message}</p>
    </div>
  `;
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  const checkBtn = document.getElementById('checkPage');
  const resultsDiv = document.getElementById('results');
  const upsellLink = document.getElementById('upsellLink');

  // Set up upsell link
  const tabInfo = await getCurrentTab();
  if (tabInfo) {
    upsellLink.href = `https://sitespellchecker.com/site-scans/checkout?domain=${encodeURIComponent(tabInfo.domain)}`;
  }

  // Check for cached results
  const hasCached = await loadCachedResults();
  if (hasCached) {
    displayResults(currentResults);
    checkBtn.textContent = 'Check Again';
  }

  // Check button handler
  checkBtn.addEventListener('click', async () => {
    const current = await getCurrentTab();
    
    if (!current || current.fullUrl.startsWith('chrome://') || current.fullUrl.startsWith('edge://') || current.fullUrl.startsWith('about:')) {
      showError('Cannot check browser internal pages');
      return;
    }

    checkBtn.disabled = true;

    try {
      // Clear previous highlights
      try {
        await chrome.tabs.sendMessage(current.tabId, { action: 'clear' });
      } catch (e) {
        // Content script might not be loaded yet
      }

      // Show checking status
      showLoading('Scanning page...');

      // Send check command with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(current.tabId, { action: 'check' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Spell check timed out')), 30000)
        )
      ]);
      
      if (response && response.success) {
        currentResults = response.errors;
        currentUrl = current.fullUrl;
        displayResults(response.errors);
        checkBtn.textContent = 'Check Again';
      } else {
        throw new Error(response?.error || 'Check failed');
      }
    } catch (error) {
      console.error('Error:', error);
      
      if (error.message.includes('Could not establish connection')) {
        showError('Please refresh the page and try again');
      } else {
        showError(error.message || 'Could not check page. Try refreshing.');
      }
    } finally {
      checkBtn.disabled = false;
    }
  });
});

// Clear results when tab changes
chrome.tabs.onActivated.addListener(() => {
  currentResults = null;
  currentUrl = null;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    currentResults = null;
    currentUrl = null;
  }
});
