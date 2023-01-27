
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
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      console.log('got the token', token);
      userToken = token
      // window.localStorage.setItem('userToken', userToken)
      // perform()
    })
})

// async function perform() {
//   // PUT request -
//   // const url = 'https://sheets.googleapis.com/v4/spreadsheets/1OOkUXS1hRShfFReqizv0gvmTTvVdIpwrGCHPpCOsDuQ/values/A1?valueInputOption=USER_ENTERED';

//   // POST request -
//   const url = 'https://sheets.googleapis.com/v4/spreadsheets/1OOkUXS1hRShfFReqizv0gvmTTvVdIpwrGCHPpCOsDuQ/values/Jobs!A1:append?valueInputOption=USER_ENTERED';

//   fetch(url, {
//     method: "POST",
//     headers: {
//       "Authorization": "Bearer " + userToken,
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({ "values": [["test", "Test2"]] })
//   })
//     .then(res => res.json())
//     .then(res => console.log(res))
//     .catch(err => console.log(err));
// }

chrome.tabs.executeScript(tabs[0].id, {
  file: 'script.js'
}, function() {
  chrome.tabs.sendMessage(tabs[0].id, {userToken: userToken});
})

// export { userToken, perform }