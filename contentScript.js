import { sleep } from './utils.js';

function getElementByXpath(xPath) {
  return document.evaluate(xPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
};


function getPeopleLinkedInSearch() {

  var peopleJsonArray = [];

  var pRestustN = 0;

  // asegurarnos de que este cargada la pagina > solo que detectemos a al menos 1 persona
  sleep(10);

  // get current length of people
  pRestustN = getElementByXpath("//li[@class='reusable-search__result-container']",document)['snapshotLength'];

  // if no resuls... error
  if (pRestustN === 0){ throw new Error('No people detected in results page');}

  // if (getElementByXpath("//button[@aria-label='Next']").snapshotItem(0).getAttribute('disabled') === ''){
  // // we are in the last results page > ya con que sea mayor a 0 esoty ok
  

  for (let i = 1; i <= pRestustN; ++i) {

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
    var currentOrPastPosition = getElementByXpath(preXpath+"//p[contains(@class,'entity-result__summary')]").snapshotItem(0).innerText;
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

    // additional filtes?

    // send DM //
    // ----------------------------------------------------------------

    // check if "connect" button available



    // crate Json
    var person = new Object();
    person.id = pId;
    person.name = pName;
    person.profileLink = pProfileLink;
    person.jobTitle = pJobTitle;
    person.company = pCompany;
    person.location = pLocation;
    person.connectionLevel = pConnection;
    person.status = 

    // add to array
    peopleArray.push(person);
  }

  // build response
  functionRespones.peopleArray = peopleArray;
  functionRespones.sentDmsCount = sentDmsCount;

  return functionRespones;
}



// execution

(() => {

    // chrome.tabs no funciona en contentScript
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      
      console.log('contentScript- recieved onMessage action: ' + message.action);
      
      if (message.action === 'getHTML') {
        sendResponse({action: "getHTML",data: document.body.innerHTML});
      } else if (message.action === "getPeople") {
        sendResponse({action: "getPeople",data: getPeopleLinkedInSearch()});
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