import {api} from './api';

export function getStorage(name = 'blocklist') {
    return new Promise(resolve => {
        api.storage.get(name, value => {
           resolve(value[name])
        })
    })
}

function setStorage(value, name = 'blocklist') {
    let obj = {};
    obj[name] = value;
    api.storage.set(obj)
}

export function deleteBlockList(data) {
    return getStorage().then(res => {
        for (let url of data) {
            delete res[url];
        }
        setStorage(res)
    })
}