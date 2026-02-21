// Store for check results
let currentResults = null;
let currentUrl = null;

// Get current domain for upsell link
async function getCurrentDomain() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      return {
        domain: url.hostname.replace(/^www\./, ''),
        fullUrl: tab.url,
        tabId: tab.id
      };
    }
  } catch (e) {
    console.log('Could not get domain');
  }
  return null;
}

// Check if we have results for current page
async function checkExistingResults() {
  const current = await getCurrentDomain();
  if (!current) return false;
  
  // Check if we have results for this URL
  if (currentResults && currentUrl === current.fullUrl) {
    return true;
  }
  
  return false;
}

// Display results in the UI
function displayResults(errors) {
  const resultsDiv = document.getElementById('results');
  
  if (errors.length === 0) {
    resultsDiv.innerHTML = `
      <p class="hint" style="color: #4caf50;">
        ✓ No spelling errors found!
      </p>
    `;
    return;
  }

  const errorList = errors.slice(0, 10).map(err => {
    const suggestions = err.suggestions?.length 
      ? `<div class="suggestions">Did you mean: ${err.suggestions.join(', ')}</div>`
      : '';
    
    return `
      <li class="error-item">
        <span class="error-word">${escapeHtml(err.word)}</span>
        <span class="error-context">${escapeHtml(err.context)}</span>
        ${suggestions}
      </li>
    `;
  }).join('');

  const more = errors.length > 10 
    ? `<p class="hint" style="margin-top: 8px;">...and ${errors.length - 10} more errors</p>` 
    : '';

  resultsDiv.innerHTML = `
    <div class="error-count">${errors.length} error${errors.length !== 1 ? 's' : ''} found</div>
    <ul class="error-list">${errorList}</ul>
    ${more}
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  const checkBtn = document.getElementById('checkPage');
  const resultsDiv = document.getElementById('results');
  const upsellLink = document.getElementById('upsellLink');

  // Set up upsell link
  const domainInfo = await getCurrentDomain();
  if (domainInfo) {
    upsellLink.href = `https://sitespellchecker.com/site-scans/checkout?domain=${encodeURIComponent(domainInfo.domain)}`;
  }

  // Check if we have existing results for this page
  const hasExisting = await checkExistingResults();
  if (hasExisting) {
    displayResults(currentResults);
    checkBtn.textContent = 'Check Again';
  }

  // Check button handler
  checkBtn.addEventListener('click', async () => {
    checkBtn.disabled = true;
    checkBtn.textContent = 'Checking...';

    try {
      const current = await getCurrentDomain();
      
      if (!current || !current.fullUrl || current.fullUrl.startsWith('chrome://') || current.fullUrl.startsWith('edge://')) {
        resultsDiv.innerHTML = '<p class="hint" style="color: #d32f2f;">Cannot check browser internal pages</p>';
        checkBtn.disabled = false;
        checkBtn.textContent = 'Check This Page';
        return;
      }

      // Clear any previous highlights first
      try {
        await chrome.tabs.sendMessage(current.tabId, { action: 'clear' });
      } catch (e) {
        // Ignore errors if content script not loaded
      }

      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: current.tabId },
        files: ['content.js']
      });

      // Wait a bit for script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check spelling
      const response = await chrome.tabs.sendMessage(current.tabId, { action: 'check' });
      
      if (response && response.success) {
        // Store results
        currentResults = response.errors;
        currentUrl = current.fullUrl;
        
        displayResults(response.errors);
        checkBtn.textContent = 'Check Again';
      } else {
        throw new Error(response?.error || 'Check failed');
      }
    } catch (error) {
      console.error('Error:', error);
      resultsDiv.innerHTML = `
        <p class="hint" style="color: #d32f2f;">
          Could not check page. Try refreshing.
        </p>
      `;
    } finally {
      checkBtn.disabled = false;
    }
  });
});

// Listen for tab updates to clear results when navigating
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    // Clear stored results when URL changes
    currentResults = null;
    currentUrl = null;
  }
});

// Also clear when active tab changes
chrome.tabs.onActivated.addListener(() => {
  currentResults = null;
  currentUrl = null;
});
