let userToken = ""
let requestUrl = ""
// chrome.runtime.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         // listen for messages sent from background.js
//         if (request.message === 'hello!') {
//             console.log(request.url) // new url is now in content scripts!
//             runChecks()
//         }
//     })

window.addEventListener("load", runChecks, false)

function runChecks() {
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
        sendToSpreadsheet()
    })
}

function getJobTitle() {
    return document.querySelector('.jobs-unified-top-card__job-title').innerText
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
    return `${location}(${type})`.trim()
}

function getToday() {
    const today = new Date()
    const dd = today.getDate().toString().padStart(2, '0')
    const mm = (today.getMonth() + 1).toString().padStart(2, '0')
    const yyyy = today.getFullYear()
    return `${mm}/${dd}/${yyyy}`
}

function getUrl() {
    const url = window.location.href
    const jobId = url.split('?')[1].split('=')[1].split('&')[0]
    return `https://www.linkedin.com/jobs/view/${jobId}`
}

function getRequestUrl() {
    chrome.storage.sync.get(['credsObj']).then(res => {
        const spreadsheetId = res.credsObj['spreadsheet-id']
        const sheetName = res.credsObj['sheet-name']
        console.log ('spreadsheet id', spreadsheetId)
        console.log('sheetName', sheetName)
        return requestUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A1:append?valueInputOption=USER_ENTERED`
    })
}

async function sendToSpreadsheet() {
    // PUT request -
    // const url = 'https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!1:1?valueInputOption=USER_ENTERED';
    chrome.storage.sync.get(['formObj']).then(e => {
        if (Object.keys(e).length !== 0) {
            // POST request -
            // const spreadsheetUrl = 'https://sheets.googleapis.com/v4/spreadsheets/1OOkUXS1hRShfFReqizv0gvmTTvVdIpwrGCHPpCOsDuQ/values/Jobs!A1:append?valueInputOption=USER_ENTERED'
            // const spreadsheetUrl = getSpreadsheetUrl()
            console.log('values are =>', Object.values(e.formObj))
            const values = Object.values(e.formObj)
            const mappedValues = values.map(field => {
                switch (field) {
                    case 'Job Title':
                        return getJobTitle()
                    case 'Company':
                        return getCompany()
                    case 'Location':
                        return getLocation()
                    case 'Date Applied':
                        return getToday()
                    case 'Link':
                        return getUrl()
                    default:
                        return 'empty'
                }
            })
            console.log('mappedvalues=', mappedValues)
            fetch(requestUrl, {
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
        getRequestUrl()
    })
}







