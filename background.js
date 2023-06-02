(() => {
  
  // works for when a web page is loaded
  // chrome.tabs.onUpdated.addListener(function(activeInfo, sender, sendResponse) {
  //   // conditional check prevents sending multiple messages per refresh
  //   if(sender.status ===  "complete") {
  //     // do stuff here
  //     console.log('loaded web page');
  //     console.log(document.body.innerHTML);
  //   }
  // });

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('recieved onMessage: ' + message.toString());
    if (message.greeting == 'getHTML') {
      // send message to contentScript
      tabId = message.tabId;
      chrome.tabs.sendMessage(tabId, {greeting:"getHTMLinkedIn"}, function(response){
        if (response) {
          console.log("background- response arrived");
          console.log(response.data);
          sendResponse(response.data);
        } else {
          console.log("background- No response.");
        }
      });
    }
  });
  
  
  })();




















// basura code:

// Background script for LinkedIn DM Extension

// chrome.runtime.onInstalled.addListener(function() {
//   console.log('LinkedIn DM Extension installed.');
// });

// chrome.browserAction.onClicked.addListener(function(tab) {
//   console.log('LinkedIn DM Extension clicked.');
// });

// scrape current tab



// chrome.extension.onRequest.addListener(
//   function(request,sender,sendResponse) {
//     if(request.method == "getHTML"){
//       sendResponse({data:document.innerHTML, method:"getHTML"});
//     }
//   }
// );

// chrome.runtime.onMessageExternal.addListener(
//   function(request, sender, sendResponse) {
//       console.log('got chrome message')
//       if (request.method == "collectHTML") {
//           console.log('request.method == "collectHTML"')
//           sendResponse({data: document.body.innerHTML, method: "collectHTML"});
//       }
// //       return true;
// //   }
// // );

// // chrome.runtime.onMessage.addListener(
// //   function(message, callback) {
// //     console.log(sender.tab ?
// //                 "from a content script:" + sender.tab.url :
// //                 "from the extension");
// //     console.log("recieved message")
// //     if (message.greeting === "getHTML")
// //       sendResponse({data: 'document.body.innerHTML'});
// //   }
// // );



