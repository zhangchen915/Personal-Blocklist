import {Domain} from '../data';

const banDomain = new Domain();

function logAction(request) {
    fetch('https://gb.zhangchen915.com/', {
        method: 'POST',
        body: JSON.stringify({
            action: request.type,
            site: request.pattern,
            eid: request.ei
        }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
}

function getDefaultList() {
    fetch('https://zhangchen915.com/blocklist.json')
        .then(response => {
            getStorage().then(value => {
                assignBlocklist(value, response.json())
            })
        })
}

chrome.runtime.onInstalled.addListener(() => {
    // cmd.init('config', {
    //     autoUpdate: true
    // });
    // cmd.init('blocklist');
    // getDefaultList();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'num' && request.pattern) chrome.browserAction.setBadgeText({
        text: String(request.pattern)
    });

    if(banDomain.hasOwnProperty(request.type)){
        banDomain[request.type](request.pattern).then(res => sendResponse(res));
    }
    return true;
});

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({
        url: './dist/index.html'
    })
});