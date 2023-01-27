let userToken = ""

chrome.runtime.onMessage.addListener(message => {
    userToken = message.userToken
    console.log(userToken)
    //use receivedParameter as you wish.
})

const topCard = document.querySelector('.jobs-unified-top-card__content--two-pane')
const buttonsContainer = topCard.querySelector('.display-flex')
const addButton = document.createElement('button')

addButton.setAttribute('class', 'artdeco-button artdeco-button--3 artdeco-button--secondary add-button')
addButton.innerText = '+ Add'
addButton.style.marginLeft = '9px'
buttonsContainer.appendChild(addButton)


addButton.addEventListener('click', () => {
    perform()
    alert('Clicked!')
})

// var s = document.createElement('script')
// s.src = chrome.runtime.getURL('script.js')
// s.onload = function () {
//     this.remove()
// }
//     (document.head || document.documentElement).appendChild(s);




async function perform() {
    // PUT request -
    // const url = 'https://sheets.googleapis.com/v4/spreadsheets/1OOkUXS1hRShfFReqizv0gvmTTvVdIpwrGCHPpCOsDuQ/values/A1?valueInputOption=USER_ENTERED';

    // POST request -
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/1OOkUXS1hRShfFReqizv0gvmTTvVdIpwrGCHPpCOsDuQ/values/Jobs!A1:append?valueInputOption=USER_ENTERED';

    fetch(url, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + userToken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "values": [["test", "Test2"]] })
    })
        .then(res => res.json())
        .then(res => console.log(res))
        .catch(err => console.log(err));
}

// chrome.identity.getAuthToken({ interactive: true }, function (token) {
//     console.log('got the token', token);
//     userToken = token
//     perform()
// })



// WORKAROUND FOR COLLECTIONS PAGE
// window.addEventListener("load", function load(event){
//     this.window.removeEventListener("load", load, false)
//     const topCard = document.querySelector('.jobs-unified-top-card__content--two-pane')
//     const buttonsContainer = topCard.querySelector('.display-flex')
//     const addButton = document.createElement('button')

//     addButton.setAttribute('class', 'artdeco-button artdeco-button--3 artdeco-button--secondary add-button')
//     addButton.innerText = '+ Add'
//     addButton.style.marginLeft = '9px'
//     addButton.addEventListener('click', () => {
//         alert('Clicked!')
//     })
//     // topCard.appendChild(addButton)
//     buttonsContainer.appendChild(addButton)
// }, false)


