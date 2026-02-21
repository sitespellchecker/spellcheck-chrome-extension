# Site Spellchecker Chrome Extension - Fix Plan

## Critical Fixes Required

### 1. Dictionary Caching (Performance)
**Current:** Loads 539KB dictionary on every page check via fetch()
**Fix:** Cache in chrome.storage.local, load once per browser session

### 2. Content Script Architecture
**Current:** Re-injects content script on every check
**Fix:** Use persistent content script, communicate via messages

### 3. Spell Check Engine
**Current:** Custom Set-based dictionary (broken, no Hunspell rules)
**Fix:** Use Typo.js properly OR implement efficient custom solution

### 4. DOM Processing
**Current:** Modifies DOM while iterating (causes missed nodes)
**Fix:** Collect all nodes first, batch process, then highlight

### 5. Loading States
**Current:** No feedback during 500ms-2s load
**Fix:** Add progress indicator and status messages

### 6. Result Persistence
**Current:** Results lost on navigation
**Fix:** Store per-tab results in chrome.storage.session

## Implementation Order
1. Fix dictionary caching (biggest performance win)
2. Fix content script persistence
3. Rewrite spell check with proper engine
4. Fix DOM processing
5. Add UX improvements

## Testing Plan
- Test on large pages (CNN, Wikipedia)
- Measure load time before/after
- Check memory usage
- Verify all error types caught

## Progress Updates
- [ ] Dictionary caching implemented
- [ ] Content script fixed
- [ ] Spell engine rewritten
- [ ] DOM processing fixed
- [ ] UX improvements added
- [ ] PR submitted
