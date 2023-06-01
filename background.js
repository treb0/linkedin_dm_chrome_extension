// Background script for LinkedIn DM Extension

chrome.runtime.onInstalled.addListener(function() {
  console.log('LinkedIn DM Extension installed.');
});

chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('LinkedIn DM Extension clicked.');
});