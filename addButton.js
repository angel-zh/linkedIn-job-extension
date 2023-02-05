let userToken = ""

// chrome.runtime.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         // listen for messages sent from background.js
//         if (request.message === 'hello!') {
//             console.log(request.url) // new url is now in content scripts!
//             runChecks()
//         }
//     })

window.addEventListener("load", runChecks, false)

function runChecks(evt) {
    let timer = setInterval(checkForButton, 200)

    function checkForButton() {
        if (document.querySelector('.jobs-unified-top-card__content--two-pane')) {
            console.log('done loading')
            clearInterval(timer)
            afterDOMLoaded()
        }
    }
}


function getUserToken() {
    chrome.runtime.sendMessage({ text: "Token Request from addButton.js" }, function (response) {
        console.log("Response: ", response)
        userToken = response.substring(response.indexOf(':') + 2)
        perform()
    })
}

function getTitle() {
    return document.getElementsByClassName('jobs-unified-top-card__job-title')[0].innerText
}

function getCompany() {
    return document.querySelector('.jobs-unified-top-card__company-name > a').innerText
}

function getLocation() {
    const location = document.querySelector('.jobs-unified-top-card__bullet').innerText
    const type =
        document.querySelector('.jobs-unified-top-card__workplace-type')
            ? document.querySelector('.jobs-unified-top-card__workplace-type').innerText
            : ''
    return `${location} ${type}`
}

function getToday() {
    const today = new Date()
    const dd = today.getDate().toString().padStart(2, '0')
    const mm = (today.getMonth() + 1).toString().padStart(2, '0')
    const yyyy = today.getFullYear()
    return `${mm}/${dd}/${yyyy}`
}

async function perform() {
    // PUT request -
    // const url = 'https://sheets.googleapis.com/v4/spreadsheets/1OOkUXS1hRShfFReqizv0gvmTTvVdIpwrGCHPpCOsDuQ/values/A1?valueInputOption=USER_ENTERED';
    chrome.storage.sync.get(['formObj']).then(e => {
        if (Object.keys(e).length !== 0) {
            // POST request -
            const url = 'https://sheets.googleapis.com/v4/spreadsheets/1OOkUXS1hRShfFReqizv0gvmTTvVdIpwrGCHPpCOsDuQ/values/Jobs!A1:append?valueInputOption=USER_ENTERED'
            console.log('values are =>', Object.values(e.formObj))
            const values = Object.values(t.formObj)
            const mappedValues = values.map(field => {
                switch (field) {
                    case 'Job Title':
                        return getTitle()
                    case 'Company':
                        return getCompany()
                    case 'Location':
                        return getLocation()
                    case 'Date Applied':
                        return getToday()
                    case 'Link':
                        return getUrl()
                    default: 
                        return 'nothing'
                }
                // if (field === 'Job Title') {
                //     return getTitle()
                // } else if (field === 'Company') {
                //     return getCompany()
                // } else if (field === 'Location') {
                //     return getLocation()
                // } else {
                //     return 'nothing'
                // }
            })
            console.log('mappedvalues=', mappedValues)
            fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + userToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "values": [mappedValues] })
            })
                .then(res => res.json())
                .then(res => console.log(res))
                .catch(err => console.log(err))
        }
    })
}

function afterDOMLoaded() {
    const topCard = document.querySelector('.jobs-unified-top-card__content--two-pane')
    const buttonsContainer = topCard.querySelector('.display-flex')
    const addButton = document.createElement('button')

    addButton.setAttribute('class', 'artdeco-button artdeco-button--3 artdeco-button--secondary add-button')
    addButton.innerText = '+ Add'
    addButton.style.marginLeft = '9px'
    buttonsContainer.appendChild(addButton)

    addButton.addEventListener('click', () => {
        getUserToken()
    })
}







