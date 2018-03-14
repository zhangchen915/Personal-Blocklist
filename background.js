const GEN_204_URL = 'http://www.google.com/gen_204?';

const blocklist = {};
const storage = chrome.storage.local;

blocklist.common = {
    GETBLOCKLIST: 'getBlocklist',
    ADDTOBLOCKLIST: 'addToBlocklist',
    ADDBULKTOBLOCKLIST: 'addBulkToBlocklist',
    DELETEFROMBLOCKLIST: 'deleteFromBlocklist',
    FINISHEXPORT: 'finishExport'
};

/**
 * Batch size for logging bulk added patterns to gen_204.
 * @type {int}
 */
blocklist.LOG_BATCH_SIZE = 10;

/**
 * Regular expression to strip whitespace.
 * @type {RegExp}
 */
blocklist.STRIP_WHITESPACE_REGEX = new RegExp('^\s+|\s+$', 'g');

/**
 * Logs an action by sending an XHR to www.google.com/gen_204.
 * The logging action may in the form of:
 * block/release [site].
 * @param {Object} request The detail request containing site and search event
 * id.
 * @private
 */
blocklist.logAction_ = request => {
    var site = request.pattern;
    var eid = request.ei;
    var action = request.type;
    // Ignore logging when user is under https search result page.
    if (request.enc) {
        return;
    }
    var args = [
        'atyp=i',
        'oi=site_blocker',
        'ct=' + action,
        'ei=' + eid,
        'cad=' + encodeURIComponent(site)
    ];
    var url = GEN_204_URL + args.join('&');
    try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true /* async */);
        xhr.send();
    } catch (e) {
        // Unable to send XHR.
    }
};

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
                    time: 0
                };
                setStorage(value.blocklist)
                // blocklist.logAction_(request);
            }
            return {success: 1, pattern: request.pattern};
        })

    },
    'addBulkToBlocklist': request => {
        return getStorage().then(value => {
            for(let i=0;i<request.patterns.length;i++){
                if(!(request.patterns[i] in value.blocklist)){
                    value.blocklist[request.patterns[i]] = {
                        time: 0
                    };
                }
            }
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

    },
    'finishExport': () => {
        chrome.management.setEnabled(
            chrome.i18n.getMessage("@@extension_id"), localStorage['disabled'] !== 'true');
    },
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