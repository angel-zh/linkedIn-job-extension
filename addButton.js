let userToken = ""
let requestUrl = ""

// Receives message from background script, and runs check for button addition when url matches
chrome.runtime.onMessage.addListener((obj, sender, response) => {
    console.log('received', obj)
    if (obj.type === 'URL_CHANGE' &&
        (obj.url.startsWith('https://www.linkedin.com/jobs/search/') || obj.url.startsWith('https://www.linkedin.com/jobs/collections/'))
    ) {
        console.log('correct url')
        runChecks()
    }
})

// Set up timer to check page for the add-button
// Add button if not found, and remove timer when button found
function runChecks() {
    console.log('runChecks running')
    let timer = setInterval(checkForButton, 200)

    function checkForButton() {
        console.log('checkForButton RUN')
        if (
            document.querySelector('.jobs-unified-top-card__content--two-pane') &&
            !document.querySelector('.add-button')
        ) {
            console.log('done loading. No button found. Generating Button')
            clearInterval(timer)
            generateButton()
        } else if (document.querySelector('.add-button')) {
            console.log('Button found. Clearing timer')
            clearInterval(timer)
        }
    }
    // Retrieve checkbox value from chrome.storage to determine if page will use openAI 
    // If true, set up timer to check page for the ai-card
    // Add card if not found, and remove card and timer when found, before adding new card - ensured card does not persist through pages
    chrome.storage.sync.get(['aiCheckbox']).then(result => {
        if (result.aiCheckbox === true) {
            let aiTimer = setInterval(checkForAiCard, 200)
            function checkForAiCard() {
                console.log('checkForAiCard RUN')
                if (document.querySelector('#job-details')?.textContent?.length < 100) { return }

                if (
                    document.querySelector('.jobs-unified-top-card__content--two-pane') &&
                    !document.querySelector('.ai-card')
                ) {
                    console.log('done loading. No Ai card found. Generating')
                    clearInterval(aiTimer)
                    generateAiCard()
                } else if (document.querySelector('.ai-card')) {
                    console.log('ai-card found. Clearing and recreating it. Clearing timer')
                    const topCard = document.querySelector('.jobs-unified-top-card__content--two-pane')

                    const aiCard = document.querySelector('.ai-card')
                    topCard.removeChild(aiCard)
                    generateAiCard()
                    clearInterval(aiTimer)
                }
            }
        }
    })
}

// Message background script to get auth token
function getUserToken() {
    chrome.runtime.sendMessage({ text: "GET_TOKEN" }, function (response) {
        console.log("Response:", response)
        userToken = response
        sendToSpreadsheet()
    })
}

// Functions to get corresponding text from linkedin jobs page
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

function getJobDetails() {
    return document.querySelector('#job-details').textContent.trim().replace(/\s+/g, ' ')
}

function getJobID() {
    const currentUrl = location.href
    const currentJobId = currentUrl.match(/currentJobId=([^&]*)/)[1]
    return currentJobId;
}

function getToday() {
    const today = new Date()
    const dd = today.getDate().toString().padStart(2, '0')
    const mm = (today.getMonth() + 1).toString().padStart(2, '0')
    const yyyy = today.getFullYear()
    return `${mm}/${dd}/${yyyy}`
}

function getUrl() {
    return document.querySelector('.jobs-unified-top-card__content--two-pane > a').href
}

// Generate request url using stored data in chrome storage
function getRequestUrl() {
    chrome.storage.sync.get(['credsObj']).then(res => {
        const spreadsheetId = res.credsObj['spreadsheet-id']
        const sheetName = res.credsObj['sheet-name']
        return requestUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A2:append?insertDataOption=INSERT_ROWS&valueInputOption=USER_ENTERED`
    })
}

// Display success when data is added to spreadsheet
function displaySuccess() {
    const topCard = document.querySelector('.jobs-unified-top-card__content--two-pane')
    const buttonsContainer = topCard.querySelectorAll('.display-flex:not(.ivm-view-attr__img-wrapper)')[0]
    const span = document.createElement('span')
    span.innerText = '✓'
    span.style.color = '#1b9659'
    span.style.fontSize = '2.7rem'
    span.style.fontWeight = 'bold'
    buttonsContainer.appendChild(span)
    function deleteMsg() {
        span.remove()
    }
    setTimeout(deleteMsg, 3000)
}

// Communicates with background.js to get data from GPT3 to populate in the ai card
async function populateAiCard() {
    chrome.runtime.sendMessage({ text: "GPT3", data: { jobTitle: getJobTitle(), jobDescription: getJobDetails(), jobID: getJobID() } }, function (response) {
        console.log("Response:", response)
        const jobLevelValue = document.querySelector('#job-level-value')
        const jobExplanationValue = document.querySelector('#job-explanation-value')

        jobLevelValue.innerText = response.jobLevel
        jobExplanationValue.innerText = response.explanation
    })
}

// Generate and send values to google sheet
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
                .then(res => {
                    console.log(res)
                    displaySuccess()
                })
                .catch(err => console.log(err))
        }
    })
}

// Generate add-button and add event listener
function generateButton() {
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

// Generate the ai card
function generateAiCard() {
    console.log('Generating AI Card')
    const topCard = document.querySelector('.jobs-unified-top-card__content--two-pane')

    const aiCard = document.createElement('div')
    aiCard.setAttribute('class', 'mb4 artdeco-card p5 mt4 ai-card')

    const cardTitle = document.createElement('h3')
    cardTitle.setAttribute('class', 't-16 t-bold')
    cardTitle.innerText = 'AI Sentiment Analysis'

    const jobLevelText = document.createElement('h3')
    jobLevelText.setAttribute('class', 'pl1 t-14 t-black--light')
    jobLevelText.innerText = 'Job Level'

    const jobLevelValue = document.createElement('span')
    jobLevelValue.setAttribute('class', 'pl2')
    jobLevelValue.innerText = 'Loading...'
    jobLevelValue.setAttribute('id', 'job-level-value');

    const jobExplanationText = document.createElement('h3')
    jobExplanationText.setAttribute('class', 'pl1 t-14 t-black--light')
    jobExplanationText.innerText = 'Explanation'

    const jobExplanationValue = document.createElement('span')
    jobExplanationValue.setAttribute('class', 'pl2')
    jobExplanationValue.innerText = 'Loading...'
    jobExplanationValue.setAttribute('id', 'job-explanation-value')

    aiCard.appendChild(cardTitle)
    aiCard.appendChild(jobLevelText)
    aiCard.appendChild(jobLevelValue)
    aiCard.appendChild(jobExplanationText)
    aiCard.appendChild(jobExplanationValue)
    topCard.appendChild(aiCard)
    populateAiCard()
}





