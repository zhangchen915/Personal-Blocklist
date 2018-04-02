const blocklist = {};
const storage = chrome.storage.local;

function logAction (request) {
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
            for (let i = 0; i < request.patterns.length; i++) {
                if (!(request.patterns[i] in value.blocklist)) {
                    value.blocklist[request.patterns[i]] = {
                        time: 0
                    };
                }
            }
            setStorage(value.blocklist);
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