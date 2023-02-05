chrome.storage.sync.get(['formObj']).then((e)=> {
  if (Object.keys(e).length !== 0) {
    console.log(e.formObj)
    const keys = Object.keys(e.formObj)
    keys.forEach((element) => {
      const column = document.getElementById(`${element}`)
      column.value = e.formObj[element]
    })
  }
})

const logIn = document.getElementById('log-in')
const logOut = document.getElementById('log-out')
const customColumns = document.querySelector('.custom-columns')
const addColumnButton = document.getElementById('add-column-btn')
const saveButton = document.getElementById('save-btn')

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

function storeFormData() {
  const form = document.getElementById('form')
  const formData = new FormData(form)
  const formObj = Object.fromEntries(formData)
  chrome.storage.sync.set({ 'formObj': formObj }).then(() => {
    console.log('stored')
  })
  // get result
  //
  // chrome.storage.sync.get(["formObj"]).then((result)=> {
  //   console.log('result is ' + result.someKey)
  // })
  //
  // => result is someValue
}

addColumnButton.addEventListener('click', event => {
  event.preventDefault()
  addColumn()
})

saveButton.addEventListener('click', event => {
  event.preventDefault()
  storeFormData()
})


