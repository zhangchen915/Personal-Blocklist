/**
 * The URL and path to the gen_204 GWS endpoint.
 * @type {string}
 */
const GEN_204_URL = 'http://www.google.com/gen_204?';

/**
 * The oi ("onebox information") tag that identifies 204s as Site blocker.
 * @type {string}
 */
const BLOCKER_OI = 'site_blocker';

const blocklist = {};
const storage = chrome.storage.local;

/**
 * Namespace for common functions of the Blocklist Chrome extension.
 * @const
 */
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
blocklist.common.LOG_BATCH_SIZE = 10;

/**
 * Regular expression to strip whitespace.
 * @type {RegExp}
 */
blocklist.common.STRIP_WHITESPACE_REGEX = new RegExp('^\s+|\s+$', 'g');

/**
 * A regular expression to find the host for a url.
 * @type {RegExp}
 */
blocklist.common.HOST_REGEX = new RegExp(
    '^https?://(www[.])?([0-9a-zA-Z.-]+).*$');

/**
 * Logs an action by sending an XHR to www.google.com/gen_204.
 * The logging action may in the form of:
 * block/release [site].
 * @param {Object} request The detail request containing site and search event
 * id.
 * @private
 */
blocklist.common.logAction_ = function (request) {
    var site = request.pattern;
    var eid = request.ei;
    var action = request.type;
    // Ignore logging when user is under https search result page.
    if (request.enc) {
        return;
    }
    var args = [
        'atyp=i',
        'oi=' + BLOCKER_OI,
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

blocklist.common.cmd = {
    'getBlocklist': request => {
        storage.get('blocklist', (value) => {
            if (!value.blocklist) {
                value.blocklist = {};
                storage.set({'blocklist': {}})
            }
            if (request.num !== undefined && request.num > 0) {
                value.blocklist = value.blocklist.slice(request.start, request.start + request.num);
            }
            return {blocklist: value.blocklist};
        })
    },
    'addToBlocklist': request => {
        storage.get('blocklist', value => {
            if (!value.blocklist.includes(request.pattern)) {
                value.blocklist[request.pattern] = {
                    time: 0
                };
                storage.set({'blocklist': value.blocklist})
                // blocklist.common.logAction_(request);
            }
            return {success: 1, pattern: request.pattern};
        })

    },
    'addBulkToBlocklist': request => {
        storage.get('blocklist', value => {
            request.patterns.forEach(e => {
                if (!value.blocklist.includes(e)) {
                    value.blocklist.push(e);
                }
            });
            storage.set({'blocklist': value.blocklist});
            return {success: 1};
        })


    },
    'deleteFromBlocklist': request => {
        storage.get('blocklist', value => {
            if (value.blocklist[request.pattern]) {
                value.blocklist[request.pattern] = null;
                storage.set({'blocklist': value.blocklist})
                // blocklist.common.logAction_(request);
            }
        });
        return {success: 1, pattern: request.pattern};
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
    sendResponse(blocklist.common.cmd[request.type](request));
    return true;
});

chrome.browserAction.onClicked.addListener(() => {
    chrome.tabs.create({
        url: './dist/index.html'
    })
});