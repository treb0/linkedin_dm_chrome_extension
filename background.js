import { getVariableFromChromeStorage, getTodayStr, sleep, sendChromeMessage } from './utils.js';

// key to have the service worker active, and not "service worker (Inactive)"
// https://stackoverflow.com/questions/71724980/chrome-extension-always-show-service-worker-inactive-after-browser-restart-if
chrome.runtime.onStartup.addListener( () => {
  console.log("onStartup()");
});

// const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
// chrome.runtime.onStartup.addListener(keepAlive);
// keepAlive();

console.log("background.js loaded");

// // listen for messages from contenctScript
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log('background.js- recieved onMessage action: ' + message.action);
//   if (message.action === "getPeopleStatus") {
//     peopleStatus = getVariableFromChromeStorage("peopleStatus");
//     sendResponse({action: "getPeopleStatus", peopleStatus: peopleStatus});
//   }
// })
  
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name !== "searchResults") return;
  ports.push(port);
  // Remove port when destroyed (eg when devtools instance is closed)
  port.onDisconnect.addListener(function() {
      var i = ports.indexOf(port);
      if (i !== -1) ports.splice(i, 1);
  });
  port.onMessage.addListener(function(msg) {
      // Received message from devtools. Do something:
      console.log('Received message from contentScript searchResults page', msg);

      if (msg.action === "getPeopleStatus") {
        peopleStatus = getVariableFromChromeStorage("peopleStatus");
        sendResponse({action: "getPeopleStatus", peopleStatus: peopleStatus});
      }

  });
});




// (() => {

//   console.log("background.js loaded");
  
//   // // listen for messages from contenctScript
//   // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   //   console.log('background.js- recieved onMessage action: ' + message.action);
//   //   if (message.action === "getPeopleStatus") {
//   //     peopleStatus = getVariableFromChromeStorage("peopleStatus");
//   //     sendResponse({action: "getPeopleStatus", peopleStatus: peopleStatus});
//   //   }
//   // })

//   // works for when a web page is loaded
//   // chrome.tabs.onUpdated.addListener(function(activeInfo, sender, sendResponse) {
//   //   // conditional check prevents sending multiple messages per refresh
//   //   if(sender.status ===  "complete") {
//   //     // do stuff here
//   //     console.log('loaded web page');
//   //     console.log(document.body.innerHTML);
//   //   }
//   // });

//   // // funciona para recibir de action.js y consultar a contentScript y repsonder a action.js
//   // chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//   //   console.log('recieved onMessage: ' + message.toString());
//   //   if (message.greeting == 'getHTML') {
//   //     // send message to contentScript
//   //     tabId = message.tabId;
//   //     chrome.tabs.sendMessage(tabId, {greeting:"getHTMLinkedIn"}, function(response){
//   //       if (response) {
//   //         console.log("background- response arrived");
//   //         console.log(response.data);
//   //         sendResponse(response.data);
//   //       } else {
//   //         console.log("background- No response.");
//   //       }
//   //     });
//   //   }
//   // });


  
  
//   })();




















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



