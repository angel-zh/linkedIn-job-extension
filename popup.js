
let userToken = ""

const logOut = document.getElementById('log-out')
logOut.addEventListener('click', () => {
  console.log(userToken)
  window.fetch(`https://accounts.google.com/o/oauth2/revoke?token=${userToken}`)
    .then(response => response.json())
    .then(data => console.log(data))
})

const logIn = document.getElementById('log-in')
logIn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ text: "Login Request from popup.js" }, function (response) {
    console.log("Response: ", response)
    userToken = response.substring(response.indexOf(':') + 2)
  })
})


const saveButton = document.getElementById('save-btn')

function storeFormData() {
  const columnTitle1 = document.getElementById('col-1').value
  localStorage.setItem('column1', columnTitle1)
  const columnTitle2 = document.getElementById('col-2').value
  localStorage.setItem('column2', columnTitle2)
  const columnTitle3 = document.getElementById('col-3').value
  localStorage.setItem('column3', columnTitle3)
  const columnTitle4 = document.getElementById('col-4').value
  localStorage.setItem('column4', columnTitle4)
  const columnTitle5 = document.getElementById('col-5').value
  localStorage.setItem('column5', columnTitle5)
  const columnTitle6 = document.getElementById('col-6').value
  localStorage.setItem('column6', columnTitle6)
}

saveButton.addEventListener('click', event => {
  event.preventDefault()
  storeFormData()
})