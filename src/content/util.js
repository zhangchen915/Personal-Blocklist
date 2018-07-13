export const $ = (e) => document.querySelector(e);

export function parseHTML(str) {
    let tmp = document.implementation.createHTMLDocument();
    tmp.body.innerHTML = str;
    return tmp.body.children[0];
}

// Match each level of subdomains against the blocklist. For example, if
// a.com is blocked, b.a.com should be hidden from search result.
function extractSubDomains(pattern) {
    const subDomains = [];
    const parts = pattern.split('.');
    for (let i = parts.length - 2; i >= 0; --i) {
        subDomains.push(parts.slice(i).join('.'));
    }
    return subDomains;
}

export async function findBlockPatternForHost(hostName) {
    for (let [_, item] of Object.entries(extractSubDomains(hostName))) {
        const response = await Action.sendCmd('find', item);
        if (response.success) return true
    }

    return false
}

export class Action {
    static sendCmd(cmd, pattern = '') {
        return new Promise(resolve => {
                chrome.runtime.sendMessage({
                    type: cmd,
                    pattern: pattern,
                    enc: !!document.URL.indexOf('https://')
                }, response => {
                    resolve(response)
                })
            }
        )
    };

    static blocklistPattern(pattern, blockState) {
        return Action.sendCmd(blockState ? 'remove' : 'add', pattern);
    }

    static getDomain(searchResult) {
        return searchResult.querySelector('h3 > a').href.replace(new RegExp('^https?://(www[.])?([0-9a-zA-Z.-]+).*$'), '$2');
    };
}