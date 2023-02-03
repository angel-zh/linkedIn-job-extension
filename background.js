// chrome.tabs.onUpdated.addListener(
//     function(tabId, changeInfo, tab) {
//       if (changeInfo.url) {
//         chrome.tabs.sendMessage( tabId, {
//           message: 'hello!',
//           url: changeInfo.url
//         })
//       }
//     console.log('changed', changeInfo.url)
//     }
//   );
chrome.runtime.onMessage.addListener(
    function (msg, sender, sendResponse) {
        console.log("Received %o from %o, frame", msg, sender.tab, sender.frameId)
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            console.log('got the token', token)
            sendResponse(`Response from background.js: ${token}`)
        })
        // As per this stackoverflow thread - https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
        // return true is needed to indicate that you'll call the response asynchronously
        return true
    })