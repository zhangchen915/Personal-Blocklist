const storage = chrome.storage.local;

function logAction(request) {
    fetch('https://gb.zhangchen915.com/', {
        method: 'POST',
        body: JSON.stringify({
            action:request.type,
            site:request.pattern,
            eid:request.ei
        }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
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
    fetch('https://zhangchen915.com/blocklist.json')
        .then(response => {
            getStorage().then(value => {
                assignBlocklist(value, response.json())
            })
        })
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