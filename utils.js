export const getVariableFromChromeStorage = key =>
  new Promise((resolve, reject) =>
    chrome.storage.sync.get(key, result =>
      chrome.runtime.lastError
        ? reject(Error(chrome.runtime.lastError.message))
        : resolve(result[key])
    )
  )

export function getTodayStr() {
  return (new Date()).toISOString().split('T')[0];
}

export function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds*1000));
}

// payload must include an action, it is our way to handle and distinguish chrome messages
export function sendChromeMessage(payload) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tab = tabs[0];
    var action = payload.action;
    chrome.tabs.sendMessage(tab.id, payload, function(response) {
        if (response.action === action) {
            console.log("response arrived for action " + action);
            return response;
        } else {
            console.log("No response for action: " + action);
            throw new Error('No response message for action: ' + action);
        }
    });
});
}