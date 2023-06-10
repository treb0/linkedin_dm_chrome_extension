// cannot import functions because I cannot change the html to make the code a module...
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds*1000));
};

function getElementByXpath(xPath) {
  return document.evaluate(xPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
};

// payload must include a action
function sendMessageToExtension(payload) {
  // send message to extention (action.js)
  var action = payload.action;
  console.log('contenScript-- sent message of action: ' + action);
  chrome.runtime.sendMessage(payload, function(response) {
    if (response) {
        console.log("contenScript-- recieved response for action: " + action);
        return response;
    } else {
        console.log("contenScript-- No response for action: " + action);
    }
  });
}

// activate the connect message by sending a keyboardEvent
function sendKeyboardEvent(element) {

  var dispatchKeyboardEvent = function(target, initKeyboradEvent_args) {
    var e = document.createEvent("KeyboardEvents");
    e.initKeyboardEvent.apply(e, Array.prototype.slice.call(arguments, 1));
    target.dispatchEvent(e);
  };

  dispatchKeyboardEvent(element, 'keyup', true, true, null, 'h', 0, '');
}


async function clickNextLinkedInPage() {

  await sleep(4);

  // check if next button is disabled
  if (getElementByXpath("//button[@aria-label='Next']").snapshotItem(0).getAttribute("disabled") === ''){
    // button is disabled > finished
    return false;
  }
  // get next button's id
  var nextBtnId = getElementByXpath("//button[@aria-label='Next']").snapshotItem(0).getAttribute("id");

  // click next button
  document.getElementById(nextBtnId).click();

  return true;
}

function sendTestMessage() {
  chrome.runtime.sendMessage({action: "testMessageFromContentScript2"}, function(response) {
    if (response) {
        console.log("contenScript: response2 arrived");
        console.log(response.data);
    } else {
        console.log("contenScript: No response2.");
    }
  });
}

async function sendLinkedInDMs(messageTemplate,maxDMs) {

  // defin initial variables
  var peopleArray = [];
  var pRestustN = 0;
  var sentDmsCount = 0;
  var sentDmsCount = 0;

  // asegurarnos de que este cargada la pagina > solo que detectemos a al menos 1 persona
  await sleep(10);

  // get current length of people
  pRestustN = getElementByXpath("//li[@class='reusable-search__result-container']")['snapshotLength'];

  // if no resuls... error
  if (pRestustN === 0){ throw new Error('No people detected in results page');}

  // if (getElementByXpath("//button[@aria-label='Next']").snapshotItem(0).getAttribute('disabled') === ''){
  // // we are in the last results page > ya con que sea mayor a 0 esoty ok

  for (let i = 1; i <= pRestustN; ++i) {

    // analyze if we have already sent maxDMs number of DMs
    if (sentDmsCount >= maxDMs) {break;}

    // build pre XPath to add to every xpath
    var preXpath = "//li[@class='reusable-search__result-container'][" + i + "]";

    // name
    var pName = getElementByXpath(preXpath+"//img[contains(@src,'profile')]").snapshotItem(0).getAttribute('alt');
    
    // profile link
    var pProfileLink = getElementByXpath(preXpath+"//a[contains(@href,'https://www.linkedin.com/in/')]").snapshotItem(0).getAttribute('href').split('?')[0].trim()
    var pId = pProfileLink.replace("https://www.linkedin.com/in/","").trim()

    //// job title & company
    var pJobTitle = "";
    var pCompany = "";
    // first we try to get it from subheading "current:"
    // a person can not have a subheading, so we have to catch that
    var currentOrPastPositionHtml = getElementByXpath(preXpath+"//p[contains(@class,'entity-result__summary')]").snapshotItem(0);
    var currentOrPastPosition = ''
    if (currentOrPastPositionHtml !== null) { currentOrPastPosition = currentOrPastPositionHtml.innerText; }
    // if subheading does not contain "current:" (can have "past:") then we look for it in his primary subtitle
    if (currentOrPastPosition.includes("Current:")) {
      pJobTitle = currentOrPastPosition.split(" at ")[0].replace("Current: ","");
      pCompany = currentOrPastPosition.split(" at ")[1];
    }
    else {
      var primarySubtitle = getElementByXpath(preXpath+"//div[@class='entity-result__primary-subtitle t-14 t-black t-normal']").snapshotItem(0).innerText;
      // regex match if contain at or @
      if (primarySubtitle.match("( at |@)") === null) {
        // no match, will only save all as current job
        pJobTitle = primarySubtitle;
      } else {
        // there is a match
        if (primarySubtitle.match("@") === null) {
          pJobTitle = primarySubtitle.split(" at ")[0];
          pCompany = primarySubtitle.split(" at ")[1];
        } else {
          pJobTitle = primarySubtitle.split("@")[0];
          pCompany = primarySubtitle.split("@")[1];
        }
      }
    }
    // final validation: ademas borrar lo que venga tras un "|"
    pJobTitle = pJobTitle.split("|")[0].trim();
    pCompany = pCompany.split("|")[0].trim();

    // location
    var pLocation = getElementByXpath(preXpath+"//div[@class='entity-result__secondary-subtitle t-14 t-normal']").snapshotItem(0).innerText;

    // connectionLevel
    var connectionLevelHtml = getElementByXpath(preXpath+"//span[@class='image-text-lockup__text entity-result__badge-text']/span").snapshotItem(0).innerText
    var pConnection = -1;
    if (connectionLevelHtml.includes('1st')) { pConnection = 1}
    else if (connectionLevelHtml.includes('2nd')) { pConnection = 2}
    else if (connectionLevelHtml.includes('3rd')) { pConnection = 3};

    // additional filters?

    // send DM //
    // ----------------------------------------------------------------

    // check if "connect" button available
    // aria-label="Invite Paula Lopetegui to connect"
    var hasConnectBtn = getElementByXpath(preXpath+"//button[@type='button'][contains(@aria-label,'to connect')]").snapshotItem(0) !== null;

    if (!hasConnectBtn) {
      pStatus = "No connect button available"
    } else {
      // go ahead and connect
      // build user-specific message
      var message = messageTemplate.replace('{{full_name}}',pName);
      message = message.replace('{{first_name}}',pName.split(' ')[0]);
      message = message.replace('{{title}}',pJobTitle);
      message = message.replace('{{company}}',pCompany);
      // click connect button
      var connectBtnId = getElementByXpath(preXpath+"//button[@type='button'][contains(@aria-label,'to connect')]").snapshotItem(0).getAttribute("id");
      document.getElementById(connectBtnId).click();
      // click add a note
      await sleep(3);
      var addNoteBtnId = getElementByXpath("//button[@aria-label='Add a note']").snapshotItem(0).getAttribute("id");
      document.getElementById(addNoteBtnId).click();
      // add the message
      await sleep(2);
      textareaElement = document.getElementById("custom-message");
      textareaElement.value = message;
      // send now button is currently disabled because document did not detect the writing of the message

      // enable message by sending keyboardEvent
      await sleep(1);
      sendKeyboardEvent(textareaElement);
      await sleep(1);

      // // go ahead and enable button
      var sendNowBtnId = getElementByXpath("//button[@aria-label='Send now']").snapshotItem(0).getAttribute("id");
      // document.getElementById(sendNowBtnId).removeAttribute("disabled");
      // document.getElementById(sendNowBtnId).classList.remove('artdeco-button--disabled');
      // await sleep(1);

      // click it
      // throw new Error('stopping run to review if all ok'); // debugging
      document.getElementById(sendNowBtnId).click();
      await sleep(2);

      // update status
      sentDmsCount++;
      pStatus = "Sent DM";
      // send message to update html of dms sent
      sendMessageToExtension({action: "1DMSent"});
    }

    // crate Json
    var person = new Object();
    person.id = pId;
    person.name = pName;
    person.profileLink = pProfileLink;
    person.jobTitle = pJobTitle;
    person.company = pCompany;
    person.location = pLocation;
    person.connectionLevel = pConnection;
    person.status = pStatus;

    // add to array
    peopleArray.push(person);
  }

  // send message to action.js of people DMed
  sendMessageToExtension({action: "sentDMs", newPeople: peopleArray, sentDmsCount: sentDmsCount, maxDMs: maxDMs});
}



// execution

// chrome.tabs no funciona en contentScript

(() => {

  console.log('LinkedIn DMs Extension: loaded contentScript');;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      
    console.log('contentScript- recieved onMessage action: ' + message.action);
    
    if (message.action === 'getHTML') {
      sendResponse({action: "getHTML",data: document.body.innerHTML});
    } 
    else if (message.action === "nextPage") {

      sendResponse({action: "nextPage"
                   ,ok: true
                  });

      // click next page
      clickNextLinkedInPage();
    }
    else if (message.action === "testMessageFromContentScript") {
      sendResponse({action: "testMessageFromContentScript",data: true});
      sendTestMessage();
    }
    else if (message.action === "sendDMs") {

      // respond ok to action.js
      sendResponse({action: "sendDMs"
                   ,ok: true
                  });

      var messageTemplate = message.messageTemplate;
      var maxDMs = message.maxDMs;

      // send DMs
      functionRespones = sendLinkedInDMs(messageTemplate,maxDMs);  
    } 
    else if (message.action === "sendingDMsNextPage") {
      // respond ok to action.js
      sendResponse({action: message.action, ok: true});

      var maxDMs = message.maxDMs;

      var clicked = clickNextLinkedInPage();

      sendMessageToExtension({action: "sendinDMsClickedNextPage", clicked: clicked, maxDMs: maxDMs});
    };
  })

})();











// // cuando traté usar los nodos para queriar dentro de resultados... pero luego pasé a tocar el xpath directo


// function getElementByXpath(xPath,parent,method=XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) {
//   return document.evaluate(xPath, parent, null, method, null);
// };



// var peopleJsonArray = [];

//   var pRestustN = getElementByXpath("//li[@class='reusable-search__result-container']",document)['snapshotLength'];
//   console.log('pRestustN: '+pRestustN)

//   let pContainerIterator = getElementByXpath("//li[@class='reusable-search__result-container']",document,method=XPathResult.ORDERED_NODE_ITERATOR_TYPE);

//   for (let i = 0; i < pRestustN; ++i) {

//     // get container html
//     var pContainer = pContainerIterator.iterateNext();

//     // name
//     var pName = getElementByXpath("//img[contains(@src,'profile')]",pContainer).snapshotItem(0).getAttribute('alt');
    
//     // profile link
//     var pProfileLink = getElementByXpath("//a[contains(@href,'https://www.linkedin.com/in/')]",pContainer).snapshotItem(0).getAttribute('href').split('?')[0].trim()

//     //// job title & company
//     var pJobTitle = "";
//     var pCompany = "";
//     // first we try to get it from subheading "current:"
//     var currentOrPastPosition = getElementByXpath("//p[contains(@class,'entity-result__summary')]",pContainer).snapshotItem(0).innerText;
//     // if subheading does not contain "current:" (can have "past:") then we look for it in his primary subtitle
//     if (currentOrPastPosition.includes("Current:")) {
//       pJobTitle = currentOrPastPosition.split(" at ")[0].replace("Current: ","");
//       pCompany = currentOrPastPosition.split(" at ")[1];
//     }
//     else {
//       var primarySubtitle = getElementByXpath("div[@class='entity-result__primary-subtitle t-14 t-black t-normal']",pContainer).snapshotItem(0).innerText;
//       // regex match if contain at or @
//       if (primarySubtitle.match("( at |@") === none) {
//         // no match, will only save all as current job
//         pJobTitle = primarySubtitle;
//       } else {
//         // there is a match
//         if (primarySubtitle.match("@") === none) {
//           pJobTitle = primarySubtitle.split(" at ")[0];
//           pCompany = primarySubtitle.split(" at ")[1];
//         } else {
//           pJobTitle = primarySubtitle.split("@")[0];
//           pCompany = primarySubtitle.split("@")[1];
//         }
//       }
//     }
//     // final validation: ademas borrar lo que venga tras un "|"
//     pJobTitle = pJobTitle.split("|")[0].trim();
//     pCompany = pCompany.split("|")[0].trim();

//     // location
//     var pLocation = getElementByXpath("//div[@class='entity-result__secondary-subtitle t-14 t-normal']",pContainer).snapshotItem(0).innerText;

//     // connectionLevel
//     var connectionLevelHtml = getElementByXpath("//span[@class='image-text-lockup__text entity-result__badge-text']/span", pContainer).snapshotItem(0).innerText
//     var pConnection = -1;
//     if (connectionLevelHtml.includes('1st')) { pConnection = 1}
//     else if (connectionLevelHtml.includes('2nd')) { pConnection = 2}
//     else if (connectionLevelHtml.includes('3rd')) { pConnection = 3};

//     // timestamp
//     var pTimestamp = Date.now();

//     // crate Json
//     var obj = new Object();
//     obj.name = pName;
//     obj.profileLink = pProfileLink;
//     obj.jobTitle = pJobTitle;
//     obj.company = pCompany;
//     obj.location = pLocation;
//     obj.connectionLevel = pConnection;
//     obj.timestamp = pTimestamp;
//     var personJson = JSON.stringify(obj);

//     // add to array
//     peopleJsonArray.push(personJson);
//   }

//   return peopleJsonArray;
// }