const logIn = document.getElementById('log-in')
const logOut = document.getElementById('log-out')
const submitButton = document.getElementById('submit-btn')
const addColumnButton = document.getElementById('add-column-btn')
const saveButton = document.getElementById('save-btn')
const createSheetButton = document.getElementById('create-sheet-btn')
const customColumns = document.querySelector('.custom-columns')

const credsSection = document.getElementById('spreadsheet-creds')
const form = document.getElementById('form')

let counter = 1
let requestUrl = ""

// Check chrome storage for logged in status to conditionally render sections
chrome.storage.sync.get(["isLoggedIn", "credsObj"]).then((result) => {
  console.log('isLoggedIn', result.isLoggedIn)
  console.log('credsObj', result.credsObj)
  if (result.isLoggedIn !== true) {
    logIn.classList.remove('hide')
    credsSection.classList.add('hide')
    form.classList.add('hide')
  }
  if (result.isLoggedIn && result.credsObj === undefined ) {
    form.classList.add('hide')
  }
})

// Retrieve saved data from chrome.storage and populate form inputs
function populateInput(data, addCredLink = false) {
  chrome.storage.sync.get([data]).then(e => {
    if (Object.keys(e[data]).length > 5) {
      const num = Object.keys(e[data]).length - 5
      for (let i = 0; i < num; i++) {
        addColumn()
      }
    }
    if (Object.keys(e).length !== 0) {
      const keys = Object.keys(e[data])
      keys.forEach((element) => {
        const input = document.getElementById(`${element}`)
        input.value = e[data][element]
      })

      if (addCredLink) {
        generateLink(e[data]['spreadsheet-id'])
      }
    }
  })
}

populateInput('formObj')
populateInput('credsObj', true)

// Log in and retrieve user token by sending message to background.js
logIn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ text: "Login Request from popup.js" }, function (response) {
    console.log(response)
    logIn.classList.add('hide')
    credsSection.classList.remove('hide')
  })
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
function displaySuccessMsg(id) {
  const msg = document.createElement('div')
  msg.innerText = 'Success!'
  msg.setAttribute('class', 'highlight')
  document.getElementById(id).appendChild(msg)

  function deleteMsg() {
    msg.remove()
  }
  setTimeout(deleteMsg, 2800)
}

// Creates a link to the user's spreadsheet
function generateLink(id) {
  const link = document.getElementById('link')
  const url = `https://docs.google.com/spreadsheets/d/${id}/edit`
  link.innerHTML = `<a href=${url} target="blank">${url}</a>`
}

// Store user's speadsheet credentials (id and sheet name) as obj in chrome.storage
function storeSpreadsheetCreds() {
  const creds = document.getElementById('spreadsheet-creds-form')
  const credsData = new FormData(creds)
  const credsObj = Object.fromEntries(credsData)
  chrome.storage.sync.set({ 'credsObj': credsObj }).then(() => {
    console.log('stored creds')
    displaySuccessMsg('spreadsheet-creds-form')
  })
  generateLink(credsObj['spreadsheet-id'])
  form.classList.remove('hide')
}

// Store user's custom spreadsheet columns as obj in chrome.storage
function storeFormData() {
  const form = document.getElementById('form')
  const formData = new FormData(form)
  const formObj = Object.fromEntries(formData)
  chrome.storage.sync.set({ 'formObj': formObj }).then(() => {
    console.log('stored form')
    displaySuccessMsg('fieldset')
  })
}

// Creates a new spreadsheet
function createNewSpreadsheet() {
  chrome.runtime.sendMessage({ text: "Token Request from popup.js" }, function (response) {
    console.log("Response: ", response)
    const userToken = response

    fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + userToken,
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(res => {
        document.getElementById('spreadsheet-id').value = res.spreadsheetId
        document.getElementById('sheet-name').value = 'Sheet1'
        storeSpreadsheetCreds()
        generateLink(res.spreadsheetId)
        form.classList.remove('hide')
      })
  })
}

// Generates the URL for PUT request to send/update column titles
function getRequestUrl() {
  chrome.storage.sync.get(['credsObj']).then(res => {
    const spreadsheetId = res.credsObj['spreadsheet-id']
    const sheetName = res.credsObj['sheet-name']
    return requestUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!1:1?valueInputOption=USER_ENTERED`
  })
}

// Updates the first row of spreadsheet with selected column titles
async function sendColTitles() {
  chrome.runtime.sendMessage({ text: "Login Request from popup.js" }, function (response) {
    console.log("Response:", response)
    const userToken = response

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

// Confirm new spreadsheet creation
function confirmAction() {
  const response = confirm("Do you want to create a new Google spreadsheet?")
  response ? createNewSpreadsheet() : null
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
  getRequestUrl()
  sendColTitles()
})

createSheetButton.addEventListener('click', event => {
  event.preventDefault()
  confirmAction()
})
