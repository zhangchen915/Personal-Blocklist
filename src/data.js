import * as api from './api';

export function getStorage(name = 'blocklist') {
    return new Promise(resolve => {
        api.storage.get(name, value => resolve(value))
    })
}

function setStorage(value, name = 'blocklist') {
    let obj = {};
    obj[name] = value;
    api.storage.set(obj)
}

export function deleteBlockList(data) {
    getStorage().then(res => {
        for (let url of data) {
            if (res[url]) res[url] = null;
        }
        setStorage(res)
    })
}