// alert(document.title)

(() => {

    
    // chrome.tabs.onMessage.addListener((message, sender, sendResponse) => {
    ///// Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('contentScript- recieved onMessage: ' + message.toString());
      if (message.greeting == 'getHTMLinkedIn') {
        console.log('contentScript-greeting: ' + message.greeting);
        sendResponse({data: document.body.innerHTML});
      }
    });
    

    
})();