const storage = chrome.storage.local;

export function getStorage(name = 'blocklist') {
    return new Promise((resolve) => {
        storage.get(name, value => resolve(value))
    })
}