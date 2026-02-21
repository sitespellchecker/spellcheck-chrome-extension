# Changelog

All notable changes to the Site Spellchecker Chrome Extension.

## [1.1.0] - 2026-02-21

### Fixed
- **Performance**: Dictionary now cached in chrome.storage.local (500ms+ faster on subsequent checks)
- **Architecture**: Content script no longer re-injected on every check (eliminates memory leaks and race conditions)
- **Spell Engine**: Rewrote dictionary lookup with proper Set-based storage and Hunspell-style affix handling
- **DOM Processing**: Fixed bug where modifying DOM during TreeWalker iteration caused missed nodes
- **UX**: Added loading spinner and progress indicators during dictionary load and spell check
- **Results**: Added per-tab result caching via chrome.storage.session

### Changed
- Popup UI redesigned with better visual hierarchy and error display
- Highlight tooltips now show on hover with suggestions
- Error list scrollable with custom scrollbar
- Shows first 15 errors with "more" indicator instead of only 10

### Added
- Storage permission for dictionary and result caching
- Loading states with clear status messages
- Better error handling with user-friendly messages

## [1.0.0] - Initial Release

- Real-time spell checking with Typo.js
- Visual highlighting of errors
- Suggestions for misspelled words
- Popup with error list
- Upsell to sitespellchecker.com
