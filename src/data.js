const storage = chrome.storage.local;

export function getStorage(name = 'blocklist') {
    return new Promise(resolve => {
        storage.get(name, value => resolve(value))
    })
}

function setStorage(value, name = 'blocklist') {
    let obj = {};
    obj[name] = value;
    storage.set(obj)
}

export function deleteBlockList(data) {
    getStorage().then(res => {
        for (let url of data) {
            if (res[url]) res[url] = null;
        }
        setStorage(res)
    })
}