import { getVariableFromChromeStorage } from './utils.js';

// set global variable
var message = ''
var searchFilters = [];

window.onload = async function() {

  console.log('Popup view loaded');

  // get saved variables from Google Storage
  message = await getVariableFromChromeStorage("message");
  searchFilters = await getVariableFromChromeStorage("searchFilters");

  console.log('message: ' + message);
  console.log('searchFilters: ' + searchFilters);

  // validation to set Action message and button
  var actionp = document.getElementById('actionp');
  var actionBtn = document.getElementById('actionBtn');
  if ((Object.keys(message).length === 0) || (Object.keys(searchFilters).length === 0)){
    actionp.innerText = "Define your message and at least 1 search to begin sending DMs";
    // grey-out
    actionBtn.className = "btn-1grayed";
    // unlink
    actionBtn.href = "";
  } else {
    actionp.innerText = "Start sending DMs!";
  }
}
