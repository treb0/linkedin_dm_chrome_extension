// set global variables ------------------------------------
var messageTemplate = '';
var searchFilters = [];
var people = [];
var peopleStatus = {};
var dmsPerDay = {};
var displayButtons = true;

// cannot import functions because I cannot change the html to make the code a module...
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds*1000));
};

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

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
  nextBtnHtml = getElementByXpath("//button[@aria-label='Next']").snapshotItem(0);
  if (nextBtnHtml === null) {
    // no next button, can happen in search results with only 1 page
    return false;
  }
  else if (nextBtnHtml.getAttribute("disabled") === '') {
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




function addExtBtn(i,pStatus) {
  
  // get actions container element
  var actionContainer = document.getElementsByClassName("entity-result__actions entity-result__divider")[i-1];

  // TODO ASDFASDF choose what to inject based on pStatus
  var preXpath = "//li[@class='reusable-search__result-container'][" + i + "]";
  var pProfileLink = getElementByXpath(preXpath+"//a[contains(@href,'https://www.linkedin.com/in/')]").snapshotItem(0).getAttribute('href').split('?')[0].trim()
  var pId = pProfileLink.replace("https://www.linkedin.com/in/","").trim()

  // get pStatus
  if (peopleStatus.hasOwnProperty(pId)) { pStatus = peopleStatus[pId]; }
  else { pStatus = ""; }

  // possible pStatus: set to skip / normal ("") / sent ,, if user is 1st o 4th or already sent Connect req no button is added
  
  // only if not sent
  sentPattern = /^Sent .*/;
  if (!sentPattern.test(pStatus)) {

    console.log(pId + " status: " + pStatus);

    // detect if set to skip
    const skipPattern = /^Skip .*/;
    var setToSkip = false;
    var skipSetDay = "";
    if (skipPattern.test(pStatus)) { 
      setToSkip = true; 
      skipSetDay = peopleStatus[pId].split(" ")[1];
    }
    

    // create new elements
    var newTable = document.createElement('table');
    var row1 = document.createElement('tr');
    var row2 = document.createElement('tr');
    var newBtn = document.createElement('button');
    var newSpan = document.createElement('span');
    var description = document.createElement('pre');
    // newBtn.setAttribute("class","artdeco-button artdeco-button--2 artdeco-button--secondary ember-view search-primary-action__state-action-btn--omit-icon");
    // esto buscarlo dinamicamente de los botonos grises de arriba
    newBtn.setAttribute("class","artdeco-pill artdeco-pill--slate artdeco-pill--choice artdeco-pill--2");
    newBtn.setAttribute("type","button");
    newBtn.setAttribute("i",i);
    // center horizontally
    newBtn.style.display = "block"
    newBtn.style.margin = "auto"

    newSpan.setAttribute("class","artdeco-button__text");
    
    //setting this css style solving problem with new line in textContent
    //add \r\n in text everywhere You want for line-break (new line)
    description.setAttribute('style', 'white-space: pre;text-align: center;');

    if (setToSkip){
      newSpan.innerText = "Will Skip";
      description.innerText = "Set to skip by\r\nuser on " + skipSetDay;
      newBtn.style.color = "brown";
    }
    else {
      newSpan.innerText = "Skip";
      description.innerText = "Click to exclude\r\nfrom autoConnect";
    }

    // font sizes
    newBtn.style.fontSize = '12px';
    description.style.fontSize = '8px';

    // add event listener
    newBtn.addEventListener("click", function() {

      if (newBtn.innerText === "Skip") {
        // change texts
        newSpan.innerText = "Will Skip";
        description.innerText = "Set to skip by\r\nuser on " + getTodayString();
        newBtn.style.color = "brown";
        // update peopleStatus
        peopleStatus[pId] = "Skip " + getTodayString();
      }
      else if (newBtn.innerText === "Will Skip") {
        // change texts
        newSpan.innerText = "Skip";
        description.innerText = "Click to exclude\r\nfrom autoConnect";
        newBtn.style.color = "gray";
        // update peopleStatus only if currently set to skip
        if (setToSkip) { peopleStatus[pId] = ""; }
      }
      // save user status onto variable and chrome.storage
      chrome.storage.sync.set({ "peopleStatus": peopleStatus}, function(){});
      
    });  

    newTable.appendChild(row1);
    newTable.appendChild(row2);
    row1.appendChild(newBtn);
    newBtn.appendChild(newSpan);
    row2.appendChild(description);

    actionContainer.insertBefore(newTable, actionContainer.firstChild);
  }
}


// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------


function getTodayStr() {
  return (new Date()).toISOString().split('T')[0];
}

// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------

async function sendLinkedInDMs(maxDMs) {

  // defin initial variables
  var sentDmsCount = 0;
  
  // retrieve chrome storage variables >> set globally
  messageTemplate = await getVariableFromChromeStorage("message");
  // peopleStatus = await getVariableFromChromeStorage("peopleStatus");
  people = await getVariableFromChromeStorage("people");
  dmsPerDay = await getVariableFromChromeStorage("dmsPerDay");

  // get todaySentDms
  var todayStr = getTodayStr();
  if (!dmsPerDay.hasOwnProperty(todayStr)) { todaySentDms = 0; } 
  else { todaySentDms = dmsPerDay[todayStr]; };
  
  while (true) {

    // asegurarnos de que este cargada la pagina > solo que detectemos a al menos 1 persona
    await sleep(10);

    // get current length of people
    var pRestustN = 0;
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

      // check if user set to skip
      const skipPattern = /^Skip .*/;
      if (skipPattern.test(peopleStatus[pId])) {continue;}

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

      // location (can be null)
      // var pLocation = getElementByXpath(preXpath+"//div[@class='entity-result__secondary-subtitle t-14 t-normal']").snapshotItem(0).innerText;
      var pLocationHtml = getElementByXpath(preXpath+"//div[@class='entity-result__secondary-subtitle t-14 t-normal']").snapshotItem(0)
      var pLocation = "";
      if (pLocationHtml !== null) { pLocation = pLocationHtml.innerText; }

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

      // build user-specific message
      var message = messageTemplate.replace('{{full_name}}',pName);
      message = message.replace('{{first_name}}',pName.split(' ')[0]);
      message = message.replace('{{title}}',pJobTitle);
      message = message.replace('{{company}}',pCompany);

      if (!hasConnectBtn) {
        pStatus = "No connect button available"
      } else if (message.length > 300) {
        pStatus = "Rendered message over 300 characters. Skipping connect."
      } else {
        // go ahead and connect
      
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
        pStatus = "Sent DM on " + todayStr;

        // udpate chrome storage dmsPerDay
        todaySentDms++;
        dmsPerDay[todayStr] = todaySentDms;
        chrome.storage.sync.set({ "dmsPerDay": dmsPerDay}, function(){});

        // send message to update html of dms sent
        sendMessageToExtension({action: "1DMSent"});
      }
      // end of for loop (people in current page results)

      // crate Json
      var person = new Object();
      person.id = pId;
      person.name = pName;
      person.profileLink = pProfileLink;
      person.jobTitle = pJobTitle;
      person.company = pCompany;
      person.location = pLocation;
      person.connectionLevel = pConnection;
      // person.status = pStatus; >> we do not save the status in people, save it on a separate json

      // update people / chrome storage
      if (!peopleStatus.hasOwnProperty(pId)) { 
        people.push(person); 
        chrome.storage.sync.set({ "people": people }, function(){});
      };

      // peopleStatus
      peopleStatus[pId] = pStatus;
      chrome.storage.sync.set({ "peopleStatus": peopleStatus}, function(){});
    }

    if (sentDmsCount >= maxDMs) {
      // finished sending dms
      sendMessageToExtension({action: "finishSendingDMs"});
      break;
    } 
    else {
      // gotta send more dms
      var clicked = clickNextLinkedInPage();
      if (!clicked) {
        // to include logic for multiple search links, here if there is another search link, we should send message to action.js to open next link
        // for now since we operate with only 1 search link, the sending is over since there are no more users
        sendMessageToExtension({action: "finishSendingDMs"});
        break;
      }
      // else: next page was clicked and we run this all over again continuing to send dms in while loop
    }
  }
}


// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------


// function to get variable from chrome storage
const getVariableFromChromeStorage = key =>
new Promise((resolve, reject) =>
  chrome.storage.sync.get(key, result =>
    chrome.runtime.lastError
      ? reject(Error(chrome.runtime.lastError.message))
      : resolve(result[key])
  )
)


// ------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------


// execution

// chrome.tabs no funciona en contentScript

// (() => {
window.onload = async function() {

  console.log('LinkedIn DMs Extension: loaded contentScript');;

  // ask and get json of people status
  peopleStatus = await getVariableFromChromeStorage("peopleStatus");
  people = await getVariableFromChromeStorage("people");
  dmsPerDay = await getVariableFromChromeStorage("dmsPerDay");
  displayButtons = await getVariableFromChromeStorage("displayButtons");

  console.log('peopleStatus: ' + JSON.stringify(peopleStatus));
  console.log('people: ' + JSON.stringify(people));
  console.log('dmsPerDay: ' + JSON.stringify(dmsPerDay));
  console.log('displayButtons: ' + displayButtons);

  // process users in search results
  const pattern = /^https:\/\/www.linkedin.com\/search\/results\/people\/.*/;
  if (pattern.test(window.location.href)) {
    // we are in a search results page

    // get current length of people
    pRestustN = getElementByXpath("//li[@class='reusable-search__result-container']")['snapshotLength'];

    // if no resuls... error
    // if (pRestustN === 0){ throw new Error('No people detected in results page');}

    for (let i = 1; i <= pRestustN; ++i) {

      // build pre XPath to add to every xpath
      var preXpath = "//li[@class='reusable-search__result-container'][" + i + "]";

      // name
      var pName = "";
      var pNameHtml = getElementByXpath(preXpath+"//img[contains(@src,'profile')]").snapshotItem(0)
      if (pNameHtml !== null) { pName = pNameHtml.getAttribute('alt'); }
      // var pName = getElementByXpath(preXpath+"//img[contains(@src,'profile')]").snapshotItem(0).getAttribute('alt');
      
      // profile link
      var pProfileLink = "";
      var pId = "";
      var pProfileLinkHtml = getElementByXpath(preXpath+"//a[contains(@href,'https://www.linkedin.com/in/')]").snapshotItem(0);
      if (pProfileLinkHtml !== null) {
        pProfileLink = pProfileLinkHtml.getAttribute('href').split('?')[0].trim();
        pId = pProfileLink.replace("https://www.linkedin.com/in/","").trim();
      }
      // var pProfileLink = getElementByXpath(preXpath+"//a[contains(@href,'https://www.linkedin.com/in/')]").snapshotItem(0).getAttribute('href').split('?')[0].trim()
      // var pId = pProfileLink.replace("https://www.linkedin.com/in/","").trim()

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

      // location (can be null)
      // var pLocation = getElementByXpath(preXpath+"//div[@class='entity-result__secondary-subtitle t-14 t-normal']").snapshotItem(0).innerText;
      var pLocationHtml = getElementByXpath(preXpath+"//div[@class='entity-result__secondary-subtitle t-14 t-normal']").snapshotItem(0)
      var pLocation = "";
      if (pLocationHtml !== null) { pLocation = pLocationHtml.innerText; }
      
      // connectionLevel
      var connectionLevelHtml = getElementByXpath(preXpath+"//span[@class='image-text-lockup__text entity-result__badge-text']/span").snapshotItem(0);
      if (connectionLevelHtml === null) { 
        pConnection = 4; 
      } else {
        var connectionLevelText = connectionLevelHtml.innerText;
        var pConnection = -1;
        if (connectionLevelText.includes('1st')) { pConnection = 1}
        else if (connectionLevelText.includes('2nd')) { pConnection = 2}
        else if (connectionLevelText.includes('3rd')) { pConnection = 3};
      }

      // get status > have to detect if person was previously flagged to skip
      pStatus = "";

      // add chorme extension button
      if ((pConnection < 4) & (displayButtons)) {
        // if toggled and person's peronal status
        // add chrome extension button / text
        addExtBtn(i,pStatus);
      }
    }
  }


  // recieve messages from chrome extension

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

// })();
}











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