
let userToken = ""

const logOut = document.getElementById('log-out')
const logIn = document.getElementById('log-in')
logOut.addEventListener('click', () => {
  console.log(userToken)
  window.fetch(`https://accounts.google.com/o/oauth2/revoke?token=${userToken}`)
    .then(response => response.json())
    .then(data => console.log(data))
})


logIn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ text: "Login Request from popup.js" }, function (response) {
    console.log("Response: ", response)
  })
})

