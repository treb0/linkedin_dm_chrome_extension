import { getVariableFromChromeStorage } from './utils.js';

// set global variable
var message = ''
var searchFilters = [];

window.onload = async function() {

  console.log('Popup view loaded');

  // get saved variables from Google Storage
  message = await getVariableFromChromeStorage("message");
  searchFilters = await getVariableFromChromeStorage("searchFilters");
  var peopleStatus = await getVariableFromChromeStorage("peopleStatus");
  var people = await getVariableFromChromeStorage("people");
  var dmsPerDay = await getVariableFromChromeStorage("dmsPerDay");

  // craete initial default values for chrome storage variables
  if (typeof peopleStatus === 'undefined') {
    peopleStatus = {};
    // save default value onto google storage
    chrome.storage.sync.set({ "peopleStatus": peopleStatus }, function(){
      console.log("Saved default value for peopleStatus onto chrome.storage");
    })
  };
  if (typeof people === 'undefined') {
    people = [];
    // save default value onto google storage
    chrome.storage.sync.set({ "people": people }, function(){
      console.log("Saved default value for people onto chrome.storage");
    })
  };
  if (typeof dmsPerDay === 'undefined') {
    dmsPerDay = {"test": 0};
    // save default value onto google storage
    chrome.storage.sync.set({ "dmsPerDay": dmsPerDay }, function(){
      console.log("Saved default value for dmsPerDay onto chrome.storage");
    })
  };

  console.log('message: ' + message);
  console.log('searchFilters: ' + searchFilters);
  console.log('peopleStatus: ' + JSON. stringify(peopleStatus));
  console.log('people: ' + JSON.stringify(people));
  console.log('dmsPerDay: ' + JSON. stringify(dmsPerDay));
  

  // validation to set Action message and button
  var actionp = document.getElementById('actionp');
  var actionBtn = document.getElementById('actionBtn');
  if ((Object.keys(message).length === 0) || (Object.keys(searchFilters).length === 0)){
    actionp.innerText = "Define your message and at least 1 search to begin sending DMs";
    // grey-out
    actionBtn.className = "btn-1grayed";
    // unlink
    actionBtn.removeAttribute("href");
  } else {
    actionp.innerText = "Start sending DMs!";
  }
}
