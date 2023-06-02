// const getVariableFromChromeStorage = key =>
//   new Promise((resolve, reject) =>
//     chrome.storage.sync.get(key, result =>
//       chrome.runtime.lastError
//         ? reject(Error(chrome.runtime.lastError.message))
//         : resolve(result[key])
//     )
//   )

import { getVariableFromChromeStorage } from './utils.js';

function addRows(tableId,searchFilters){
    // get table element from document
    var table = document.getElementById(tableId);
    // // await in case we are requesting from chrome storage
    // await searchFilters;
    console.log('got awaited')
    console.log(typeof searchFilters)
    console.log("length: " + Object.keys(searchFilters).length)
    // get current amount of rows, to know at what rown to start at
    var delButtons = document.querySelectorAll( "button[class='delRowBtn']" );
    var initialRown = delButtons.length;
    console.log('initialRown: ' + initialRown)
    // loop through searchFilters
    for (let i = 0; i < Object.keys(searchFilters).length; i++) {
        var searchSpecs = JSON.parse(searchFilters[i])
        var row = table.insertRow(-1);
        var c1 = row.insertCell(0);
        var c2 = row.insertCell(1);
        var c3 = row.insertCell(2);
        var c4 = row.insertCell(3);
        c1.innerText = searchSpecs["name"]
        c2.innerHTML = '<a href = "' + searchSpecs["link"] + '">link</a>'
        c3.innerText = "-"
        c4.innerHTML = '<button class="delRowBtn" rown="' + (initialRown+i+1) + '">Delete</button>'
        // c4.innerHTML = '<button type="button" class="delRowBtn">Delete</button>'
        // c4.innerHTML = '<input type="button" value="Delete" onclick="deleteRow(this)"/>'
    }
}

function deleteRow(event){
    // detectar elemento clickeado
    var node = event.target || event.srcElement;
    if (node.className === 'delRowBtn') {
        // elemento clickeado fue un deleteRow button
        console.log('deleteRow->if') // debugging

        // delete row from table
        var table = document.getElementById('searchTable');
        // console.log(node.getAttribute('rown'))
        var rowNumb = node.getAttribute('rown')
        table.deleteRow(rowNumb);

        // delete search from google.storage
        console.log('searchFilters before splicing')
        console.log(searchFilters)
        // remove from array
        searchFilters.splice(+rowNumb - 1, 1); // 2nd parameter == 1 means remove one item only
        // save array onto google.storage
        console.log('will save this to replace searchFilters in google storage')
        console.log(searchFilters)
        chrome.storage.sync.set({ "searchFilters": searchFilters }, function(){
            console.log("Saved onto chrome.storage");
        });
        // update the rown data of each table row
        var delButtons = document.querySelectorAll( "button[class='delRowBtn']" );
        console.log('len(delButtons): ' + delButtons.length)
        for ( var counter = 0; counter < delButtons.length; counter++){
            delButtons[counter].setAttribute("rown", counter + 1);
        }
    }
    else {
        console.log('deleteRow->else')
        console.log(node.className)
        console.log(typeof node.className)
    }
}

var searchFilters = [];

// add event listeners for delete buttons
// escucha todos los clicks y luego dentro de deleteRow validamos que el elemento clickeado sea un deleteRow button
document.addEventListener("click", deleteRow);

window.onload = async function() {

    console.log('Search view loaded');

    // get saved Search Filters from Google Storage
    searchFilters = await getVariableFromChromeStorage("searchFilters")

    console.log('searchFilters')
    console.log(searchFilters)

    // add them as rows
    // addRows("searchTable",searchFilters)
    addRows("searchTable",searchFilters)
    
    // add new search function
    document.getElementById('submit-new-search').onclick = function () {
        // get new search details
        var searchName = document.getElementById("new_search_name").value;
        var searchLink = document.getElementById("new_search_link").value;

        // create json to save in storage
        var obj = new Object();
        obj.name = searchName;
        obj.link = searchLink;
        var searchJson = JSON.stringify(obj);

        console.log(searchJson)
        // console.log(searchName)
        // console.log(searchLink)

        // erase form
        document.getElementById("new_search_link").value = '';
        document.getElementById("new_search_name").value = '';

        // save onto google storage
        var newsearchFilters = [...searchFilters, searchJson]
        chrome.storage.sync.set({ "searchFilters": newsearchFilters }, function(){
            console.log("Saved onto chrome.storage");
        });

        // add to table
        addRows("searchTable",[searchJson])
    }
}
