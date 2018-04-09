const blocklist = {};
const storage = chrome.storage.local;

function logAction(request) {
    const site = request.pattern;
    const eid = request.ei;
    const action = request.type;
    const GEN_204_URL = 'http://www.google.com/gen_204?';
    // Ignore logging when user is under https search result page.
    if (request.enc) return;
    const args = [
        'atyp=i',
        'oi=site_blocker',
        'ct=' + action,
        'ei=' + eid,
        'cad=' + encodeURIComponent(site)
    ];
    const url = GEN_204_URL + args.join('&');
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
    } catch (e) {
    }
}

function getStorage(name = 'blocklist') {
    return new Promise((resolve) => {
        storage.get(name, value => resolve(value))
    })
}

function setStorage(value, name = 'blocklist') {
    let obj = {};
    obj[name] = value;
    storage.set(obj)
}

function assignBlocklist(value, list) {
    for (let key in list) {
        if (!value.blocklist.hasOwnProperty(key)){
            value.blocklist[key] = {time: 0};
        }
    }
    setStorage(value.blocklist);
}

blocklist.cmd = {
    'getBlocklist': request => {
        return getStorage().then(value => {
            if (!value.blocklist) setStorage(value.blocklist = {});
            if (request.num !== undefined && request.num > 0) {
                value.blocklist = value.blocklist.slice(request.start, request.start + request.num);
            }
            return {blocklist: value.blocklist};
        });
    },
    'addToBlocklist': request => {
        return getStorage().then(value => {
            if (!value.blocklist[request.pattern]) {
                value.blocklist[request.pattern] = {
                    time: 1
                };
                setStorage(value.blocklist)
                // logAction_(request);
            }
            return {success: 1, pattern: request.pattern};
        })

    },
    'importBlocklist': request => {
        return getStorage().then(value => {
            assignBlocklist(value, request.pattern);
            return {success: 1};
        })
    },
    'addTime': request => {
        return getStorage().then(value => {
            value.blocklist[request.pattern].time += 1;
            setStorage(value.blocklist);
            return {success: 1};
        })
    },
    'deleteFromBlocklist': request => {
        return getStorage().then(value => {
            if (value.blocklist[request.pattern]) {
                value.blocklist[request.pattern] = null;
                setStorage(value.blocklist)
                // blocklist.logAction_(request);
            }
            return {success: 1, pattern: request.pattern};
        });
    }
};

chrome.runtime.onInstalled.addListener(() => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://zhangchen915.com/blocklist.json', true);
    xhr.send(null);
    console.log('in')

    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
            const status = xhr.status;
            const type = xhr.getResponseHeader('Content-type');
            if (status >= 200 && status < 300 && type === 'application/json') {
                getStorage().then(value => {
                    try {
                        assignBlocklist(value, JSON.parse(xhr.responseText))
                    } catch (e) {
                    }
                })
            }
        }
    }
});

/**
 * Provides read & write access to local storage for content scripts.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    blocklist.cmd[request.type](request).then(res => sendResponse(res));
    return true;
});

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({
        url: './dist/index.html'
    })
});