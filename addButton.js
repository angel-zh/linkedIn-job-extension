let userToken = ""
let requestUrl = ""

chrome.runtime.onMessage.addListener((obj, sender, response) => {
    console.log('received', obj)
    if (obj.type === 'URL_CHANGE' &&
        (obj.url.startsWith('https://www.linkedin.com/jobs/search/') || obj.url.startsWith('https://www.linkedin.com/jobs/collections/'))
    ) {
        console.log('correct url')
        runChecks()
    }
});


function runChecks() {
    console.log('runChecks running')
    let timer = setInterval(checkForButton, 200)

    function checkForButton() {
        console.log('checkForButton RUN')
        if
            (
            document.querySelector('.jobs-unified-top-card__content--two-pane') &&
            !document.querySelector('.add-button')
        ) {
            console.log('done loading. No button found. Generating Button')
            clearInterval(timer)
            afterDOMLoaded()
        } else if (document.querySelector('.add-button')) {
            console.log('Button found. Clearing timer')
            clearInterval(timer)
        }
    }
}

function getUserToken() {
    chrome.runtime.sendMessage({ text: "Token Request from addButton.js" }, function (response) {
        console.log("Response:", response)
        userToken = response
        sendToSpreadsheet()
    })
}

function getJobTitle() {
    return document.querySelector('.jobs-unified-top-card__job-title').innerText
}

function getCompany() {
    return document.querySelector('.jobs-unified-top-card__company-name').innerText
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
        return requestUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A2:append?insertDataOption=INSERT_ROWS&valueInputOption=USER_ENTERED`
    })
}

async function sendToSpreadsheet() {
    chrome.storage.sync.get(['formObj']).then(e => {
        if (Object.keys(e).length !== 0) {
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
                        return null
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
    const buttonsContainer = topCard.querySelectorAll('.display-flex:not(.ivm-view-attr__img-wrapper)')[0]
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







