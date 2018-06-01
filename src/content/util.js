export const $ = (e) => document.querySelector(e);

export function parseHTML(str) {
    let tmp = document.implementation.createHTMLDocument();
    tmp.body.innerHTML = str;
    return tmp.body.children[0];
}

// Match each level of subdomains against the blocklist. For example, if
// a.com is blocked, b.a.com should be hidden from search result.
export function extractSubDomains(pattern) {
    const subDomains = [];
    const parts = pattern.split('.');
    for (let i = parts.length - 2; i >= 0; --i) {
        subDomains.push(parts.slice(i).join('.'));
    }
    return subDomains;
}