import { getVariableFromChromeStorage } from './utils.js';

// set global variable
var message = ''

function propagateMessage(message) {
  // update initial <p>
  var pCurrentMessage = document.getElementById('currentMessage');
  pCurrentMessage.innerText = message;

  // update rendered message
  var pRenderedMessage = document.getElementById('renderedMessage');
  var renderedMessage = message.replace('{{full_name}}','Elon Musk');
  renderedMessage = renderedMessage.replace('{{first_name}}','Elon');
  renderedMessage = renderedMessage.replace('{{last_name}}','Musk');
  renderedMessage = renderedMessage.replace('{{title}}','CEO');
  renderedMessage = renderedMessage.replace('{{company}}','Tesla');
  pRenderedMessage.innerText = renderedMessage;
}

window.onload = async function() {

  console.log('Messages view loaded');

  // get saved Message from Google Storage
  message = await getVariableFromChromeStorage("message");
  propagateMessage(message);

  // editBtn click handler
  // ----------------------------------------------------------------
  document.getElementById('editBtn').onclick = function () {

    console.log("edit button clicked");
    
    // surface textarea and submit button
    document.getElementById("editMessage").className = "textarea";
    document.getElementById("submitBtn").className = "violetBtn";

    // hide edit button
    document.getElementById("editBtn").className = "hidden";
  };

  // submitBtn click handler
  // ----------------------------------------------------------------
  document.getElementById('submitBtn').onclick = function () {

    console.log("submit button clicked");

    // get new message
    message = document.getElementById("editMessage").value;

    propagateMessage(message);

    // save onto google storage
    chrome.storage.sync.set({ "message": message }, function(){
      console.log("Saved message onto chrome.storage");

    // hide textarea and submit button
    document.getElementById("editMessage").className = "hidden";
    document.getElementById("submitBtn").className = "hidden";

    // surface edit button
    document.getElementById("editBtn").className = "yellowBtn";
    });
  }

}