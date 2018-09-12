import {Domain} from '../data';

const banDomain = new Domain();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'num') chrome.browserAction.setBadgeText({
        text: String(request.pattern)
    });

    if (banDomain[request.type]) banDomain[request.type](request.pattern).then(res => sendResponse(res));
    return true;
});

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({
        url: './dist/index.html'
    })
});