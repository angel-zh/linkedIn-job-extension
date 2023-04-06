const DB_NAME = 'AddedInDB'
const DB_VERSION = 2

// Create or Open IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onerror = () => {
            console.error('Error opening database')
            reject()
        }
        request.onsuccess = () => {
            console.log('Database opened successfully');
            resolve(request.result)
        }
        request.onupgradeneeded = (event) => {
            let db = event.target.result
            let objectStore = db.createObjectStore('aiData', { keyPath: 'jobID' })
            objectStore.createIndex('jobID', 'jobID', { unique: true })
        }
    })
}

// Add data to IndexedDB
function addToDatabase(jobID, gpt3Answer) {
    return new Promise((resolve, reject) => {
        openDatabase().then((db) => {
            const transaction = db.transaction(['aiData'], 'readwrite')
            const objectStore = transaction.objectStore('aiData')
            const request = objectStore.add({ jobID, gpt3Answer })
            request.onsuccess = () => {
                console.log('Data added to database', { jobID, gpt3Answer })
                resolve()
            };
            request.onerror = () => {
                console.error('Error adding data to database')
                reject()
            }
        })
    })
}

// Fetch data from IndexedDB
function getFromDatabase(jobID) {
    return new Promise((resolve, reject) => {
        openDatabase().then((db) => {
            const transaction = db.transaction(['aiData'], 'readonly')
            const objectStore = transaction.objectStore('aiData')
            const index = objectStore.index('jobID')
            const request = index.get(jobID)
            request.onsuccess = () => {
                if (request.result) {
                    console.log('Data retrieved from database:', request.result.gpt3Answer)
                    resolve(request.result.gpt3Answer);
                } else {
                    console.log('No data found in database for jobID:', jobID)
                    resolve(null)
                }
            };
            request.onerror = () => {
                console.error('Error retrieving data from database')
                reject()
            }
        })
    })
}

// Checks for URL changes in the tab, monitors linkedin pages and sends message to content script when url matches
chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url.match('https:\/\/.*.linkedin.com\/.*')) {
            chrome.tabs.sendMessage(tabId, {
                url: tab.url,
                type: 'URL_CHANGE'
            })
        }
    }
)

// When incoming message is received, checks message for text sent
// if GET_TOKEN, calls chrome.identity.getAuthToken to get token
// if GPT3, calls OpenaiFetchAPI to get GPT3 response
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId)

    // Add data to IndexedDB
    if (msg.text === 'GET_TOKEN') {
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            console.log('got the token', token)
            sendResponse(token)

            let isLoggedIn = token ? true : false
            chrome.storage.sync.set({ 'isLoggedIn': isLoggedIn }).then(() => {
                console.log('isLoggedIn', isLoggedIn)
            })
        })
    }

    if (msg.text === 'GPT3') {
        getFromDatabase(msg.data.jobID).then((data) => {
            if (data) {
                sendResponse(data)
            } else {
                console.log('Calling AI due to no data in DB')
                OpenaiFetchAPI(msg.data.jobTitle, msg.data.jobDescription, msg.data.jobID).then((data) => {
                    sendResponse(data)
                })
            }
        })
    }

    // As per this stackoverflow thread - https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
    // return true is needed to indicate that you'll call the response asynchronously
    return true
}
)

// OpenAI API call
function OpenaiFetchAPI(jobTitle, jobDescription, jobID) {
    console.log(`Calling GPT3, JOB ID= ${jobID}`)
    const url = "https://api.openai.com/v1/chat/completions";
    const bearer = 'Bearer ' + ''
    const messages = [
        { "role": 'system', "content": `Your job is to analyze the job description, determine the job level, and explain to me how you've come to this conclusion. Pick from the following options:\nJunior, Mid, Senior, Senior+.\nAnswer in JSON format with two params "jobLevel" and "explanation"\nThe explanation should be concise and no more than 5 sentences` },
        { "role": 'user', "content": `Job Title: """${jobTitle}"""\nJob Description: """${jobDescription}"""` }]
    console.log(messages[1]["content"])
    const res = fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': bearer,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "messages": messages,
            "model": "gpt-3.5-turbo",
            "temperature": 0.20,
            "top_p": 1
        })

    }).then(response => {
        return response.json()
    }).then(data => {
        console.log(data)
        console.log(typeof data)
        console.log(Object.keys(data))
        const content = JSON.parse(data['choices'][0].message.content.trim())
        console.log(content)
        addToDatabase(jobID, content)
        return content
    }).catch(error => {
        console.log('Something bad happened ' + error)
        return {
            jobLevel: 'Error',
            explanation: 'Error'
        }
    })
    return res
}