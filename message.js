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
  // renderedMessage = renderedMessage.replace('{{last_name}}','Musk');
  renderedMessage = renderedMessage.replace('{{title}}','CEO');
  renderedMessage = renderedMessage.replace('{{company}}','Tesla');
  pRenderedMessage.innerText = renderedMessage;
}

function updateMessageLengthCount() {
  var messageLength = document.getElementById('editMessage').value.length;
  var countP = document.getElementById('lengthCount');
  
  if (messageLength > 300) {
    countP.className = "warning";
    countP.innerText = messageLength + ' / 300 - Message is too long!';
  } else {
    countP.className = 'lengthCount';
    countP.innerText = messageLength + ' / 300';
  }
}

document.addEventListener('keydown', (event) => {
  updateMessageLengthCount();
}, false);


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
    document.getElementById("editTitle").className = "editTitle";
    document.getElementById("editMessage").className = "editMessageTextArea";
    document.getElementById("editMessage").value = message;
    document.getElementById("submitBtn").className = "violetBtn";
    updateMessageLengthCount();
    document.getElementById("lengthCount").className = "lengthCount";

    // hide edit button
    document.getElementById("editBtn").className = "hidden";
  };

  // submitBtn click handler
  // ----------------------------------------------------------------
  document.getElementById('submitBtn').onclick = function () {

    console.log("submit button clicked");

    // get new message
    message = document.getElementById("editMessage").value;

    if ( (280 < message.length) & (message.length <= 300) ) {
      // alert user that if when sending messages, the message ends up being 300 char or more, that connect will be skipped
      alert("When sending Connect requests, if rendered message surpases the 300 character limit, that Connect will be skipped.");
    }

    if (message.length <= 300) {

      propagateMessage(message);

      // save onto google storage
      chrome.storage.sync.set({ "message": message }, function(){
        console.log("Saved message onto chrome.storage");

      // hide textarea and submit button
      document.getElementById("editTitle").className = "hidden";
      document.getElementById("editMessage").className = "hidden";
      document.getElementById("submitBtn").className = "hidden";
      document.getElementById("lengthCount").className = "hidden";

      // surface edit button
      document.getElementById("editBtn").className = "yellowBtn";
      });
    } else {
      // alert user that they must shorten message to 300 characters or less
      alert("Message length must be less or equal to 300 characters");
    } 
  }
}