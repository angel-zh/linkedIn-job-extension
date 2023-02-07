// Retrieve saved data from chrome.storage and populate form inputs
function populateInput(data) {
  chrome.storage.sync.get([data]).then(e => {
    if (Object.keys(e).length !== 0 && Object.keys(e).length <= 5) {
      console.log('obj from storage', e[data])
      const keys = Object.keys(e[data])
      keys.forEach((element) => {
        const input = document.getElementById(`${element}`)
        input.value = e[data][element]
      })
    }
    if (Object.keys(e).length > 5) {
      console.log('uh')
    }
  })
}

populateInput('formObj')
populateInput('credsObj')

const logIn = document.getElementById('log-in')
const logOut = document.getElementById('log-out')
const customColumns = document.querySelector('.custom-columns')
const submitButton = document.getElementById('submit-btn')
const addColumnButton = document.getElementById('add-column-btn')
const saveButton = document.getElementById('save-btn')
const createSheetButton = document.getElementById('create-sheet-btn')

let userToken = ""
let counter = 1

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
  input.classList.add('col')
  input.placeholder = 'Enter Column Title'
  removeButton.innerText = 'x'
  removeButton.onclick = removeColumn
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

function createNewSpreadsheet() {
  chrome.runtime.sendMessage({ text: "Login Request from popup.js" }, function (response) {
    console.log("Response: ", response)
    userToken = response.substring(response.indexOf(':') + 2)
    fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + userToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ "sheets": 
        [
          {
            "properties" : {
              "title" : 'TESTTTTTTT'
            }
          } 
        ]
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log('this is the spreadsheetURL =>', res.spreadsheetUrl)
        console.log('this is the spreadsheet ID =>', res.spreadsheetId)
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
})

saveButton.addEventListener('click', event => {
  event.preventDefault()
  storeFormData()
})

createSheetButton.addEventListener('click', event => {
  event.preventDefault()
  createNewSpreadsheet()
})
