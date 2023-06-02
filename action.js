import { getVariableFromChromeStorage } from './utils.js';

// set global variable
var message = ''
var searchFilters = [];

// (async () => {
//     async chrome.tabs.getSelected(null, function(tab) {
//         const response = await chrome.tabs.sendMessage(tab.id, {greeting: "getHTML"});
//     });
//     // do something with response here, not outside the function
//     console.log(response.data);
// })();

// (async () => {
//     const response = await chrome.runtime.sendMessage({greeting: "getHTML"});
//     // do something with response here, not outside the function
//     console.log(response);
//   })();


// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     var tab = tabs[0];
//     chrome.tabs.sendMessage(tab.id, {greeting: "getHTML"}, function(response) {
//         if (response) {
//             console.log("response arrived");
//             console.log(response.data);
//         } else {
//             console.log("No response.");
//         }
//     });
// });



// ESTE FUNCIONA PARA HABLAR CON BACKGROUND.JS
// chrome.runtime.sendMessage({greeting: "getHTML"}, function(response) {
//     if (response) {
//         console.log("response arrived");
//         console.log(response.data);
//     } else {
//         console.log("No response.");
//     }
// });

// HABLAR CON BACKGROUND.JS mandandole el tabid
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tab = tabs[0];
    chrome.runtime.sendMessage({tabId: tab.id, greeting: "getHTML"}, function(response) {
        if (response) {
            console.log("response arrived");
            console.log(response.data);
        } else {
            console.log("No response.");
        }
    });
});


// chrome.tabs.getSelected(null, function(tab) {
//     chrome.tabs.sendMessage(tab.id, {greeting: "getHTML"}, function(response) {
//         if (response) {
//             console.log("response arrived");
//             console.log(response.data);
//         } else {
//             console.log("No response.");
//         }
//         if(response.method=="getHTML") {
//             tabHtml = response.data;
//             console.log(tabHtml);
//         }
//     });
// });




window.onload = async function() {

    console.log('Action view loaded');

    // get saved variables from Google Storage
    message = await getVariableFromChromeStorage("message");
    searchFilters = await getVariableFromChromeStorage("searchFilters")
    

    // editBtn click handler
    // ----------------------------------------------------------------
    document.getElementById('startBtn').onclick = function () {

        console.log("start button clicked");

        // get total DMs to sned
        var dmsPre = document.getElementById("dms").value;
        var dms = parseInt(dmsPre);
        // validate it is a number lower or equal to 200
        if ((dms > 200) || (dms < 1) || isNaN(dms)){
            
            var youEntered = ''
            if (dmsPre === "") { youEntered = "*nothing*"; } 
            else { youEntered = dmsPre; };
            
            alert("Enter a valid number: between 1 and 200\n\nYou entered: " + youEntered);
            
            document.getElementById("dms").value = "";
        } else {
            // update textarea data with parsed number
            document.getElementById("dms").value = dms;

            // surface processsing gif and progress p and stop button
            document.getElementById("processingContainer").className = "image-container";
            document.getElementById("progressp").className = "";
            document.getElementById("progressp").innerText = "Sent 0 DMs of total " + dms;
            document.getElementById("stopBtn").className = "violetBtn";
            // hide startBtn
            document.getElementById("startBtn").className = "hidden";

            // open search link
            // var searchLink = JSON.parse(searchFilters[0])['link'];
            // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            //     var tab = tabs[0];
            //     chrome.tabs.update(tab.id, {url: searchLink});
            // });

            // wait page to fully load

            // scrape people
            // var tabHtml = '';
            console.log('scraping current tab');
            chrome.tabs.getSelected(null, function(tab) {
                chrome.tabs.sendRequest(tab.id, {method: "getHTML"}, function(response) {
                    if(response.method=="getHTML") {
                        tabHtml = response.data;
                        console.log(tabHtml);
                    }
                });
            });

            // var tabHtml = ''
            // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            //     chrome.tabs.sendMessage(tabs[0].id, {method: "collectHTML"}, function(response) {
            //         if (response) {
            //             tabHtml = response.data;
            //             console.log("response arrived");
            //             console.log(tabHtml);
            //         } else {
            //             console.log("No response.");
            //         }
            //     });
            //   });
            
            (async () => {
                const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
                const response = await chrome.tabs.sendMessage(tab.id, {greeting: "getHTML"});
                // do something with response here, not outside the function
                console.log(response.data);
            })();
              

            // console.log(tabHtml);



            // loop through people of current search results page

        }

        
        
    };

    // submitBtn click handler
    // ----------------------------------------------------------------
    document.getElementById('stopBtn').onclick = function () {

        console.log("stop button clicked");

        // hide processsing gif and progress p and stop button
        document.getElementById("processingContainer").className = "hidden";
        document.getElementById("progressp").className = "hidden";
        document.getElementById("stopBtn").className = "hidden";
        // surface startBtn
        document.getElementById("startBtn").className = "yellowBtn";

    }

}
  