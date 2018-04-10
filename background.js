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
        storage.get(name, value => resolve(value[name]))
    })
}

function setStorage(value, name = 'blocklist') {
    let obj = {};
    obj[name] = value;
    storage.set(obj)
}

function assignBlocklist(value, list) {
    for (let key in list) {
        if (!value.hasOwnProperty(key)) {
            value[key] = {time: 0};
        }
    }
    setStorage(value);
}

const cmd = {
    'init': (name, data = {}) => {
        getStorage(name).then(value => {
            if (!value) setStorage(data, name)
        });
    },
    'getBlocklist': request => {
        return getStorage().then(value => {
            if (!value) setStorage(value = {});
            if (request.num !== undefined && request.num > 0) {
                value = value.slice(request.start, request.start + request.num);
            }
            return {blocklist: value};
        });
    },
    'addToBlocklist': request => {
        return getStorage().then(value => {
            if (!value[request.pattern]) {
                value[request.pattern] = {
                    time: 1
                };
                setStorage(value)
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
            value[request.pattern].time += 1;
            setStorage(value);
            return {success: 1};
        })
    },
    'deleteFromBlocklist': request => {
        return getStorage().then(value => {
            if (value[request.pattern]) {
                value[request.pattern] = null;
                setStorage(value)
            }
            return {success: 1, pattern: request.pattern};
        });
    }
};

function getDefaultList() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://zhangchen915.com/blocklist.json', true);
    xhr.send(null);
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
}

chrome.runtime.onInstalled.addListener(() => {
    cmd.init('config', {
        autoUpdate: true
    });
    cmd.init('blocklist');
    getDefaultList();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    cmd[request.type](request).then(res => sendResponse(res));
    return true;
});

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({
        url: './dist/index.html'
    })
});