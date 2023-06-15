import { getVariableFromChromeStorage, getTodayStr, sleep, sendChromeMessage } from './utils.js';

// runtime

window.onload = async function() {

    var displayButtons = await getVariableFromChromeStorage("displayButtons");

    // set initial values for variables not created yet
    if (typeof displayButtons === 'undefined') {displayButtons = true;};

    console.log('displayButtons: ' + displayButtons);

    var checkbox = document.getElementById("displayButtons");

    // set checked
    checkbox.checked = displayButtons;

    // listen to changes in checked
    checkbox.addEventListener('change', function() {
        displayButtons = this.checked;
        chrome.storage.sync.set({ "displayButtons": displayButtons }, function(){});
      });
      


}