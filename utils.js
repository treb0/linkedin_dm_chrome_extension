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

export async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds*1000));
}
