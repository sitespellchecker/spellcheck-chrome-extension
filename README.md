# Site Spellchecker - Chrome Extension

A Chrome extension that spell checks web pages using Typo.js with Hunspell dictionaries, with an upsell to check entire websites at sitespellchecker.com.

## Features

- **Real-time spell checking** using Typo.js with full Hunspell English dictionary
- **Smart suggestions** - Shows possible corrections for misspelled words
- **Visual highlighting** - Errors highlighted in red on the page with hover tooltips
- **Error list** - View all errors in the popup with context
- **Full site upsell** - Promote sitespellchecker.com for comprehensive website scanning
- **Lightweight** - Only ~570KB total including dictionary files

## Quick Start

### 1. Generate Icons (One-time setup)

Convert the SVG icon to PNG files. You can use:

**Option A: Online Converter**
- Go to https://convertio.co/svg-png/
- Upload `icons/icon.svg`
- Download 16x16, 48x48, and 128x128 PNG versions
- Save as `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`

**Option B: Node.js Script**
```bash
npm install -g sharp
node scripts/generate-icons.js
```

**Option C: ImageMagick**
```bash
convert icons/icon.svg -resize 16x16 icons/icon16.png
convert icons/icon.svg -resize 48x48 icons/icon48.png
convert icons/icon.svg -resize 128x128 icons/icon128.png
```

### 2. Install Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this project folder

### 3. Use It

1. Navigate to any webpage
2. Click the extension icon in the toolbar
3. Click "Check This Page"
4. View spelling errors highlighted in red
5. See suggestions in the popup and on hover
6. Click "Clear Highlights" when done

## File Structure

```
├── manifest.json       # Extension configuration (Manifest V3)
├── popup.html          # Extension popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic
├── content.js          # Content script for spell checking
├── content.css         # Styles for highlighted words
├── background.js       # Service worker
├── lib/                # Third-party libraries
│   ├── typo.js         # Typo.js spell checker
│   ├── en_US.dic       # Hunspell dictionary (539KB)
│   └── en_US.aff       # Hunspell affix rules
├── icons/              # Extension icons
│   ├── icon.svg        # Source icon
│   ├── icon16.png      # Toolbar icon (generate from SVG)
│   ├── icon48.png      # Management page icon
│   └── icon128.png     # Web Store icon
├── README.md           # This file
└── AGENTS.md           # Development guidelines
```

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
    ↓ (sendMessage)
Content Script (content.js)
    ↓ (fetch)
Dictionary Files (lib/)
    ↓ (Typo.js)
Spell Check Results
    ↓ (sendResponse)
Popup Display
```

## Technical Details

### Manifest V3 Features Used

- **`web_accessible_resources`**: Makes dictionary files accessible to content scripts
- **`chrome.tabs.sendMessage`**: Communication between popup and content script
- **`chrome.scripting`**: Programmatic injection (though we use declarative content scripts)

### Typo.js Integration

The extension uses **Typo.js** with the full **Hunspell en_US dictionary**:

- **Dictionary Size**: ~90,000 words
- **Affix Rules**: Handles plurals, verb conjugations, etc.
- **Suggestions**: Levenshtein distance algorithm for corrections

### Performance Considerations

- **Lazy Loading**: Dictionary loads only on first spell check
- **Caching**: Dictionary stays loaded in content script until page refresh
- **Text Node Filtering**: Excludes scripts, styles, and already-highlighted elements
- **Chunked Processing**: Words are processed in batches to avoid blocking

## Customization

### Add Domain-Specific Words

Edit `content.js` and add words to the dictionary check:

```javascript
// Before calling typo.check(), add custom words:
if (['YourBrand', 'ProductName'].includes(word)) {
  return; // Skip checking
}
```

### Change Highlight Style

Edit `content.css`:

```css
.spellcheck-highlight {
  background-color: #ffeb3b; /* Yellow instead of red */
  text-decoration: underline wavy red;
}
```

### Modify Upsell URL

Edit `popup.html` line ~35:

```html
<a href="https://yoursite.com?utm_source=extension" target="_blank">
```

## Development

### Testing Locally

1. Make code changes
2. Go to `chrome://extensions/`
3. Click refresh icon on the extension card
4. Test on various websites

### Debugging

- **Popup**: Right-click extension icon → "Inspect popup" → Console
- **Content Script**: Open DevTools on any page → Console
- **Background**: `chrome://extensions/` → Click "service worker" → Console

### Common Issues

**"Could not establish connection"**
- Content script isn't loaded. Refresh the page and try again.

**Dictionary not loading**
- Check that `lib/en_US.dic` and `lib/en_US.aff` exist
- Verify `web_accessible_resources` in manifest.json

**Icons not showing**
- Generate PNG files from SVG (see Quick Start)

## Browser Compatibility

- ✅ Chrome 88+ (Manifest V3 required)
- ✅ Edge 88+ (Chromium-based)
- ❌ Firefox (requires Manifest V2 or V3 polyfill)
- ❌ Safari (requires different extension format)

## Privacy

This extension:
- ✅ Processes all data locally (dictionary loaded from extension files)
- ✅ Does not send page content to external servers
- ✅ Only communicates with sitespellchecker.com when user clicks the upsell link
- ✅ Uses minimal permissions (activeTab, storage, scripting)

## License

MIT License - feel free to modify and distribute.

## Support

For full website spell checking including:
- Crawling entire websites
- Checking all pages automatically
- Detailed reports and exports
- Team collaboration

Visit **[sitespellchecker.com](https://sitespellchecker.com)**

---

Built with ❤️ using Manifest V3, Typo.js, and Hunspell dictionaries.
