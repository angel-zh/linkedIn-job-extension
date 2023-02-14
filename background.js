chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url.match('https:\/\/.*.linkedin.com\/.*')) {
            chrome.tabs.sendMessage(tabId, {
                url: tab.url,
                type: 'URL_CHANGE'
            });
        }
    }
  );

chrome.runtime.onMessage.addListener(
    function (msg, sender, sendResponse) {
        console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId)
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            console.log('got the token', token)
            sendResponse(token)

            let isLoggedIn = token ? true : false
            chrome.storage.sync.set({ 'isLoggedIn': isLoggedIn }).then(() => {
                console.log('isLoggedIn', isLoggedIn)
              })
        })
        // As per this stackoverflow thread - https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
        // return true is needed to indicate that you'll call the response asynchronously
        return true
    })