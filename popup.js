// JavaScript file for LinkedIn DM Extension popup view

function sendMessage() {
  var message = document.getElementById('message').value;
  console.log('Sending message: ' + message);
}

var form = document.querySelector('form');
form.addEventListener('submit', function(event) {
  event.preventDefault();
  sendMessage();
});