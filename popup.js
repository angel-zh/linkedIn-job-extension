const logIn = document.getElementById('log-in')
const logOut = document.getElementById('log-out')
const customColumns = document.querySelector('.custom-columns')
const submitButton = document.getElementById('submit-btn')
const addColumnButton = document.getElementById('add-column-btn')
const saveButton = document.getElementById('save-btn')
const createSheetButton = document.getElementById('create-sheet-btn')

let userToken = ""
let counter = 1
let requestUrl = ""

// Retrieve saved data from chrome.storage and populate form inputs
function populateInput(data) {
  chrome.storage.sync.get([data]).then(e => {
    if (Object.keys(e[data]).length > 5) {
      const num = Object.keys(e[data]).length - 5
      console.log('num', num)
      for (let i = 0; i < num; i++) {
        addColumn()
      }
    }
    if (Object.keys(e).length !== 0) {
      console.log('obj from storage', e[data])
      const keys = Object.keys(e[data])
      keys.forEach((element) => {
        const input = document.getElementById(`${element}`)
        input.value = e[data][element]
      })
    }
  })
}

populateInput('formObj')
populateInput('credsObj')

// Log in and retrieve user token by sending message to background.js
logIn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ text: "Login Request from popup.js" }, function (response) {
    console.log("Response: ", response)
    userToken = response.substring(response.indexOf(':') + 2)
  })
})

// Log out does not work yet
logOut.addEventListener('click', () => {
  console.log(userToken)
  window.fetch(`https://accounts.google.com/o/oauth2/revoke?token=${userToken}`)
    .then(response => response.json())
    .then(data => console.log(data))
})

// Add a custom column to the spreadsheet form
function addColumn() {
  const input = document.createElement('input')
  const removeButton = document.createElement('button')
  const span = document.createElement('span')
  input.type = 'text'
  input.setAttribute('name', `custom-col-${counter}`)
  input.setAttribute('id', `custom-col-${counter}`)
  input.classList.add('col')
  input.placeholder = 'Enter Column Title'
  removeButton.innerText = 'x'
  removeButton.onclick = removeColumn
  removeButton.setAttribute('class', 'remove-btn')
  span.setAttribute('id', `custom-${counter}`)
  span.appendChild(input)
  span.appendChild(removeButton)
  customColumns.appendChild(span)
  counter += 1
}

// Remove selected column
function removeColumn() {
  this.parentElement.remove()
}

// Display message on successful submit
function displaySuccessMsg(str) {
  const p = document.createElement('p')
  p.innerText = 'Success!'
  p.setAttribute('class', 'highlight')

  str === 'stored creds'
    ?
    document.getElementById('spreadsheet-creds-form').appendChild(p)
    :
    document.getElementById('fieldset').appendChild(p)
}

// Store user's speadsheet credentials (id and sheet name) as obj in chrome.storage
function storeSpreadsheetCreds() {
  const creds = document.getElementById('spreadsheet-creds-form')
  const credsData = new FormData(creds)
  const credsObj = Object.fromEntries(credsData)
  chrome.storage.sync.set({ 'credsObj': credsObj }).then(() => {
    console.log('stored creds')
    displaySuccessMsg('stored creds')
  })
  generateLink(credsObj['spreadsheet-id'])
}

// Store user's custom spreadsheet columns as obj in chrome.storage
function storeFormData() {
  const form = document.getElementById('form')
  const formData = new FormData(form)
  const formObj = Object.fromEntries(formData)
  chrome.storage.sync.set({ 'formObj': formObj }).then(() => {
    console.log('stored form')
    displaySuccessMsg('stored form')
  })
}

function generateLink(id) {
  const link = document.getElementById('link')
  const url = `https://docs.google.com/spreadsheets/d/${id}/edit`
  link.innerHTML = `<a href=${url} target="blank">${url}</a>`
}

function createNewSpreadsheet() {
  chrome.runtime.sendMessage({ text: "Token Request from popup.js" }, function (response) {
    console.log("Response: ", response)
    userToken = response.substring(response.indexOf(':') + 2)
    fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + userToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "sheets":
          [
            {
              "properties": {
                "title": 'TESTTTTTTT'
              }
            }
          ]
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log('this is the new spreadsheetURL =>', res.spreadsheetUrl)
        console.log('this is the new spreadsheet ID =>', res.spreadsheetId)
        generateLink(res.spreadsheetUrl)
      })
  })
}

function getRequestUrl() {
  chrome.storage.sync.get(['credsObj']).then(res => {
    const spreadsheetId = res.credsObj['spreadsheet-id']
    const sheetName = res.credsObj['sheet-name']
    return requestUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!1:1?valueInputOption=USER_ENTERED`
  })
}

async function sendColTitles() {
  // PUT request -
  chrome.runtime.sendMessage({ text: "Login Request from popup.js" }, function (response) {
    console.log("Response: ", response)
    userToken = response.substring(response.indexOf(':') + 2)

    chrome.storage.sync.get(['formObj']).then(e => {
      if (Object.keys(e).length !== 0) {
        const values = Object.values(e.formObj)
        
        fetch(requestUrl, {
          method: "PUT",
          headers: {
            "Authorization": "Bearer " + userToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ "values": [values] })
        })
          .then(res => res.json())
          .then(res => console.log(res))
          .catch(err => console.log(err))
      }
    })
  })
}

submitButton.addEventListener('click', event => {
  event.preventDefault()
  storeSpreadsheetCreds()
})

addColumnButton.addEventListener('click', event => {
  event.preventDefault()
  addColumn()
  // generateLink('hello')
})

saveButton.addEventListener('click', event => {
  event.preventDefault()
  storeFormData()
  getRequestUrl()
  sendColTitles()
})

createSheetButton.addEventListener('click', event => {
  event.preventDefault()
  createNewSpreadsheet()
})
