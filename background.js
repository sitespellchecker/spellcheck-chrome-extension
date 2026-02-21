chrome.runtime.onInstalled.addListener(() => {
  console.log('Site Spell Checker extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension clicked on tab:', tab.id);
});
