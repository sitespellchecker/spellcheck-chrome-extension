# Site Spell Checker — Chrome Extension

A Chrome extension that spell checks web pages using Typo.js with Hunspell dictionaries, with an upsell to check entire websites at [sitespellchecker.com](https://sitespellchecker.com).

## Features

- **Real-time spell checking** using Typo.js with full Hunspell English dictionary
- **Smart suggestions** — Shows possible corrections for misspelled words
- **Visual highlighting** — Errors highlighted in red on the page with hover tooltips
- **Error list** — View all errors in the popup with context
- **Full site upsell** — Promote sitespellchecker.com for comprehensive website scanning
- **Lightweight** — Only ~570KB total including dictionary files

## How to Use

1. Navigate to any webpage
2. Click the extension icon in the toolbar
3. Click "Check This Page"
4. View spelling errors highlighted in red
5. See suggestions in the popup and on hover
6. Click "Clear Highlights" when done

## How It Works

### Spell Checking Process

1. **Dictionary Loading**: On first check, the extension loads the Hunspell dictionary (~539KB)
2. **DOM Traversal**: Walks through all text nodes, excluding scripts, styles, and code blocks
3. **Word Extraction**: Extracts words using regex `/\b[a-zA-Z]+\b/g`
4. **Typo.js Check**: Each word is checked against the Hunspell dictionary
5. **Suggestions**: Typo.js provides suggestions for misspelled words
6. **Visual Feedback**: Errors are wrapped in highlighted spans with tooltips

### Architecture

```
Popup (popup.js)
    ↓ (chrome.scripting.executeScript / insertCSS)
On-demand content script (content.js)
    ↓ (fetch)
Dictionary Files (lib/)
    ↓ (Typo.js)
Spell Check Results
    ↓ (sendResponse)
Popup Display
```

## File Structure

```
├── manifest.json       # Extension configuration (Manifest V3)
├── popup.html          # Extension popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic
├── content.js          # On-demand content script for spell checking
├── content.css         # Styles for highlighted words
├── lib/                # Third-party libraries
│   ├── typo.js         # Typo.js spell checker
│   ├── en_US.dic       # Hunspell dictionary (539KB)
│   └── en_US.aff       # Hunspell affix rules
└── icons/              # Extension icons
    ├── icon.svg        # Source icon
    ├── icon16.png      # Toolbar icon
    ├── icon48.png      # Management page icon
    └── icon128.png     # Web Store icon
```

## Technical Details

### Manifest V3 Features Used

- **`web_accessible_resources`**: Makes dictionary files accessible to content scripts
- **`chrome.tabs.sendMessage`**: Communication between popup and content script
- **`activeTab`**: Grants temporary access only to the page the user explicitly scans
- **`chrome.scripting`**: Injects the scanner only after the user clicks the scan button

### Typo.js Integration

The extension uses **Typo.js** with the full **Hunspell en_US dictionary**:

- **Dictionary Size**: ~90,000 words
- **Affix Rules**: Handles plurals, verb conjugations, etc.
- **Suggestions**: Levenshtein distance algorithm for corrections

### Performance

- **Lazy Injection**: The scanner is injected only when the user requests a scan
- **Lazy Loading**: Dictionary loads only on first spell check
- **Caching**: Dictionary stays loaded in the injected page context until navigation
- **Text Node Filtering**: Excludes scripts, styles, and already-highlighted elements
- **Chunked Processing**: Words are processed in batches to avoid blocking

## Browser Compatibility

- Chrome 88+ (Manifest V3 required)
- Edge 88+ (Chromium-based)

## Privacy

This extension processes everything locally — no page content is ever sent to a server.

See the full [Privacy Policy](PRIVACY.md) for details on permissions and data handling.

## License

MIT License — feel free to modify and distribute.

## Support

For full website spell checking including crawling entire websites, checking all pages automatically, detailed reports and exports, and team collaboration, visit **[sitespellchecker.com](https://sitespellchecker.com)**.
