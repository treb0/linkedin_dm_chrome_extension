import { getVariableFromChromeStorage, getTodayStr, sleep } from './utils.js';

// set global variable
var message = ''
var searchFilters = [];

// // functioning to talk to contentScript
// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     var tab = tabs[0];
//     chrome.tabs.sendMessage(tab.id, {action: "getPeople"}, function(response) {
//         if (response.action === "getPeople") {
//             console.log("response arrived");
//             console.log(response.data);
//         } else {
//             console.log("No response.");
//         }
//     });
// });

// // click next page
// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     var tab = tabs[0];
//     console.log("sent onMessage nextPage")
//     chrome.tabs.sendMessage(tab.id, {action: "nextPage"}, function(response) {
//         if (response.action === "nextPage") {
//             console.log("response arrived");
//             console.log(response.data);
//         } else {
//             console.log("No response.");
//             throw new Error('No response to nextPage message');
//         }
//     });
// });


// // test a message from contentScript
// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     var tab = tabs[0];
//     console.log("sent onMessage testMessageFromContentScript")
//     chrome.tabs.sendMessage(tab.id, {action: "testMessageFromContentScript"}, function(response) {
//         if (response.action === "testMessageFromContentScript") {
//             console.log("response arrived");
//             console.log(response.data);
//         } else {
//             console.log("No response.");
//             throw new Error('No response to nextPage message');
//         }
//     });
// });

// listen for messages from contenctScript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('action.js- recieved onMessage action: ' + message.action);
    if (message.action === "testMessageFromContentScript2") {
        sendResponse(true);
    }
    else if (message.action === "sentDMs"){
        
        sendResponse(true);

        var newPeople = message.newPeople;
        var sentDmsCount = message.sentDmsCount;
        var maxDMs = message.maxDMs;

        processNewPeople(newPeople,sentDmsCount,maxDMs);
    }
})


function processNewPeople(newPeople,sentDmsCount,maxDMs) {

    //// guardar data de resultados en storage
    // dmsPerDay (data for today was already populated)
    totalDMsSentToday = totalDMsSentToday + sentDmsCount;
    dmsPerDay[todayStr] = totalDMsSentToday;
    // people & peopleStatus
    for (let i = 0; i < newPeople.length; ++i) {

        person = newPeople[i];
        pId = person['id'];

        // people
        if (!peopleStatus.hasOwnProperty(pId)) { people.push(person); };

        // peopleStatus
        peopleStatus[pId] = person['status']
    }

    // update maxDMs
    maxDMs = maxDMs - sentDmsCount;

    // si ya esta, break, sino mandar mensaje de que aprete siguiente pagina y correr denuevo
    if (maxDMs <= 0) { 
        null; 
        // se corta el proceso simplemente porque ya se mandaron todos los dms que queríamos
    } 
    else {
        // siguen habiendo dms por mandar
        // mandamos un mensaje de que pase a la siguiente pagina
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, {action: "sendinDMsNextPage"}, function(response) {
                if (response.action === "sendinDMsNextPage") {
                    console.log("response arrived");
                } else {
                    console.log("No response.");
                    throw new Error('No response to nextPage message');
                }
            });
        });
    }
}




window.onload = async function() {

    console.log('Action view loaded');

    // get saved variables from Google Storage
    var message = await getVariableFromChromeStorage("message");
    var searchFilters = await getVariableFromChromeStorage("searchFilters");
    // array of jsons of all the people we have scraped and tryied to send a dm (does not include status)
    var people = await getVariableFromChromeStorage("people");
    // json of the people and their status, to easily access {id:status,}
    var peopleStatus = await getVariableFromChromeStorage("peopleStatus");
    // json of days and the amount of dms weve sent (counters) {day:dmsSent,}
    var dmsPerDay = await getVariableFromChromeStorage("dmsPerDay");
    
    // set initial values for variables not created yet
    if (typeof people === 'undefined') {people = [];};
    if (typeof peopleStatus === 'undefined') {peopleStatus = {};};
    if (typeof dmsPerDay === 'undefined') {dmsPerDay = {};}

    // editBtn click handler
    // ----------------------------------------------------------------
    document.getElementById('startBtn').onclick = async function () {

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
            var searchLink = JSON.parse(searchFilters[0])['link'];
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var tab = tabs[0];
                chrome.tabs.update(tab.id, {url: searchLink});
            });

            await sleep(10);

            // set value for todays dms sent
            var todayStr = getTodayStr();
            var totalDMsSentToday = 0;
            if (dmsPerDay.hasOwnProperty(todayStr)){
                totalDMsSentToday = dmsPerDay[todayStr];
            } else {
                dmsPerDay[todayStr] = 0;
            };

            // send message to contentScript para que mandeDMs, y arranque el mensajeo que termina cuando se mandend todos los dms o se acaben los resultados
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                tab = tabs[0];
                chrome.tabs.sendMessage(tab.id, {action: "sendDMs", maxDMs: dms, messageTemplate: message}, function(response) {
                    console.log("response: " + JSON.stringify(response));
                    if (response.action === "sendDMs") {
                        console.log("response arrived");
                        console.log(response);
                    } else {
                        console.log("No response.");
                        throw new Error('No response to sendDMs message');
                    }
                });
            });





                






                

              

            }
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


  










// old code ------------------------------------------------------------------------------------------------
// -------- ------------------------------------------------------------------------------------------------
// -------- ------------------------------------------------------------------------------------------------




// ESTE FUNCIONA PARA HABLAR CON BACKGROUND.JS
// chrome.runtime.sendMessage({greeting: "getHTML"}, function(response) {
//     if (response) {
//         console.log("response arrived");
//         console.log(response.data);
//     } else {
//         console.log("No response.");
//     }
// });

// // HABLAR CON BACKGROUND.JS mandandole el tabid >> esto successfully logro que recibamos el document html, pero ahora voy a probar contactar directo al contentScript
// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     var tab = tabs[0];
//     chrome.runtime.sendMessage({tabId: tab.id, greeting: "getHTML"}, function(response) {
//         if (response) {
//             console.log("response arrived");
//             console.log(response.data);
//         } else {
//             console.log("No response.");
//         }
//     });
// });
















                // // scrape people
                // var newPeople = [];
                // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                //     var tab = tabs[0];
                //     chrome.tabs.sendMessage(tab.id, {action: "sendDMs", maxDMs: maxDMs}, function(response) {
                //         if (response.action === "getPeople") {
                //             console.log("response arrived");
                //             console.log(response.data);
                //             newPeople = response.data;
                //         } else {
                //             console.log("No response.");
                //         }
                //     });
                // });

                // // record max scraped people for current search results page
                // var newPeopleLength = Object.keys(newPeople).length;
                // if (newPeopleLength === 0) {alert("Detected 0 people to DM...");};
                // // stop program?

                // // analyze if page is fully loaded / we have scraped all the people (10 per page)
                // if (newPeopleLength < 10) {
                //     if (newPeopleLength > totalPeopleInResultsPage) {
                //         totalPeopleInResultsPage = newPeopleLength;
                //         pageFullyLoaded = false;
                //     } else {
                //         pageFullyLoaded = true;
                //     }
                // } else {
                //     totalPeopleInResultsPage = 10;
                //     pageFullyLoaded = true;
                // }

                // // esto no lo vamos a usar por ahora ya que el programa solo manda el mensaje de CONNECT
                // // si despues queremos agregar que mande Message... ahi podemos utilizar este codigo
                // // // loop through people of current search results page
                // // // build list of the id of people we will dm
                // // var dmIds = [];
                // // for (var p = 0; p < newPeopleLength; p++) {
                // //     var person = newPeople[p];
                // //     // var personJsonStr = JSON.stringify(person);

                // //     // check if current person in status json
                // //     var sendDm = true;
                // //     var addToStorage = true;
                // //     if (peopleStatus.hasOwnProperty(person.id)){
                // //         addToStorage = false;
                // //         if (peopleStatus[person.id] === "sent") {sendDm = false}
                // //     }

                // //     if (sendDm) {dmIds.pop(person.id);};

                // //     if (addToStorage) {

                // //     }






                // //     if we havent contacted this person Before

                // //         contact them
                // // request user approval, if that is the option selected

                // //         if could contact => update status

                // //         save person
                // //         update status JSON
                // //         update 

                // // analyze if we have reached maxDMs to send > break

                // }
                
                // // analyze if we continue to analyze this search result page or move on
                // if (pageFullyLoaded) {
                //     // click next search results page

                //     // break if we have exhausted this search => no more people to send dms, have reached and run final page
                //     //break;
                // }










  // esto no lo vamos a usar por ahora ya que el programa solo manda el mensaje de CONNECT
// si despues queremos agregar que mande Message... ahi podemos utilizar este codigo
// // loop through people of current search results page
// // build list of the id of people we will dm
// var dmIds = [];
// for (var p = 0; p < newPeopleLength; p++) {
//     var person = newPeople[p];
//     // var personJsonStr = JSON.stringify(person);

//     // check if current person in status json
//     var sendDm = true;
//     var addToStorage = true;
//     if (peopleStatus.hasOwnProperty(person.id)){
//         addToStorage = false;
//         if (peopleStatus[person.id] === "sent") {sendDm = false}
//     }

//     if (sendDm) {dmIds.pop(person.id);};

//     if (addToStorage) {

//     }






//     if we havent contacted this person Before

//         contact them
// request user approval, if that is the option selected

//         if could contact => update status

//         save person
//         update status JSON
//         update 

// analyze if we have reached maxDMs to send > break



// analyze if we continue to analyze this search result page or move on
// if (pageFullyLoaded) {
    // click next search results page

    // break if we have exhausted this search => no more people to send dms, have reached and run final page
    //break;
// }




// // record max scraped people for current search results page
// var newPeopleLength = Object.keys(newPeople).length;
// if (newPeopleLength === 0) {alert("Detected 0 people to DM...");};
// // stop program?

// // analyze if page is fully loaded / we have scraped all the people (10 per page)
// if (newPeopleLength < 10) {
//     if (newPeopleLength > totalPeopleInResultsPage) {
//         totalPeopleInResultsPage = newPeopleLength;
//         pageFullyLoaded = false;
//     } else {
//         pageFullyLoaded = true;
//     }
// } else {
//     totalPeopleInResultsPage = 10;
//     pageFullyLoaded = true;
// }