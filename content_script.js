const blocklist = {
    common: {
        GETBLOCKLIST: 'getBlocklist',
        ADDTOBLOCKLIST: 'addToBlocklist',
        ADDBULKTOBLOCKLIST: 'addBulkToBlocklist',
        DELETEFROMBLOCKLIST: 'deleteFromBlocklist',
        FINISHEXPORT: 'finishExport'
    }
};

/**
 * Class of the search results on Google SERP.
 * @type {string}
 */
blocklist.SEARCH_RESULT_CLASS = 'g';

/**
 * Class to add to a search result after it was processed by the extension.
 * @type {string}
 */
blocklist.PERSONAL_BLOCKLIST_CLASS = 'pb';

/**
 * Class of blocked search results.
 * @type {string}
 */
blocklist.BLOCKED_SEARCH_RESULT_CLASS = 'blocked';

/**
 * Class of blocked search results that were requested to be shown.
 * @type {string}
 */
blocklist.BLOCKED_VISIBLE_SEARCH_RESULT_CLASS = 'blockedVisible';

/**
 * Class of a element that holds block/unblock links.
 * @type {string}
 */
blocklist.BLOCK_LINK_CLASS = 'fl';

/**
 * Class of the search result bodies on Google SERP.
 * @type {string}
 */
blocklist.SEARCH_RESULT_BODY_CLASS = 's';

/**
 * Class of the search results lower links on Google SERP.
 * @type {string}
 */
blocklist.SEARCH_RESULT_LOWER_LINKS_CLASS = 'gl';

/**
 * Class that contains the cite tag on Google SERP.
 * @type {string}
 */
blocklist.SEARCH_RESULT_CITE_DIV_CLASS = 'kv';

/**
 * Class of the short (snippet-less) search results links on Google SERP.
 * @type {string}
 */
blocklist.SEARCH_RESULT_SHORT_LINKS_CLASS = 'vshid';

/**
 * Class of lower links span for definition-like results (e.g. query "viagra").
 * @type {string}
 */
blocklist.DEFINITION_RESULT_LOWER_LINKS_CLASS = 'a';

/**
 * Class of book search result table cell, used to identify book search results.
 * @type {string}
 */
blocklist.BOOK_SEARCH_RESULT_CLASS = 'bkst';

/**
 * Class of the search results block div.
 * @type {string}
 */
blocklist.SEARCH_RESULT_BLOCK_CLASS = 'ires';

/**
 * Class name that identifies gws-side block links.
 * @type {string}
 */
blocklist.GWS_BLOCK_LINK_CLASS = 'kob';

/**
 * Class name that identifies showed gws-side block links.
 * @type {string}
 */
blocklist.SHOWED_GWS_BLOCK_LINK_CLASS = 'kobb';

/**
 * Type of refresh request.
 * @type {string}
 */
blocklist.REFRESH_REQUEST = 'refresh';

/**
 * A regular expression to check if personalized web search is disabled in url.
 * @type {RegExp}
 */
blocklist.PWS_REGEX = new RegExp('(&|[?])pws=0');

/**
 * Matches the kEI javascript property defined in the header of the Google SRP.
 * @type {RegExp}
 */
blocklist.EVENT_ID_REGEX = new RegExp('kEI\\:"([^"]+)"');

const searchElement = $('.g');
const i18n = chrome.i18n.getMessage;
const sendMessage = chrome.runtime.sendMessage;

class Action {
    static sendCmd(cmd, pattern = '') {
        return new Promise((resolve => {
                sendMessage({
                    type: cmd,
                    pattern: pattern,
                    ei: '', //eventId
                    enc: !!document.URL.indexOf('https://')
                }, response => {
                    resolve(response)
                })
            })
        )

    };

    static blocklistPattern(pattern, blockState) {
        return blockState ? Action.sendCmd(blocklist.common.DELETEFROMBLOCKLIST, pattern) :
            Action.sendCmd(blocklist.common.ADDTOBLOCKLIST, pattern);
    }

    static getDomain(searchResult) {
        return searchResult.find('h3 > a')[0].href.replace('^https?://(www[.])?([0-9a-zA-Z.-]+).*$', '$2');
    };
}

class Serp {
    constructor() {
        this.blockNum = 0;
        this.blockList = {};
        this.linkList = [];
        this.blocklistNotification = true;

        this.getEventId_();
        this.refreshBlocklist().then(() => {
                this.modifySearchResults_();
            }
        );

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === blocklist.REFRESH_REQUEST) {
                this.refreshBlocklist();
            } else if (request.type === blocklist.EXPORTTOGOOGLE_REQUEST) {
                document.write(request.html);
                sendMessage({type: blocklist.common.FINISHEXPORT});
            }
        });
    }


    refreshBlocklist() {
        return Action.sendCmd(blocklist.common.GETBLOCKLIST).then(response => {
                if (response.blocklist) return this.blockList = response.blocklist;
            }
        );
    };

    addLink(searchResult, host, blockState) {
        searchResult.find('ol').append(`<li class="action-menu-item ab_dropdownitem action-menu-block">
                                        <a class="fl" href="javascript:;" 
                                        title="${host}">${i18n(blockState ? 'unblockLinkPrefix' : 'blockLinkPrefix')}</a></li>`);
        const menu = $(searchResult.find('.action-menu-block'));
        menu.on('click', () => {
            Action.blocklistPattern(host, blockState).then(() => {
                this.refreshBlocklist()
            });
            menu.remove();

            this.linkList.forEach((link, i) => {
                const curElement = $(searchElement[i]);
                if (host === link.split('.').slice(-host.split('.').length).join('.')) {
                    //TODO states.blocklistNotification
                    if (blockState) {
                        curElement.removeClass('blocked blockedVisible');
                        this.addLink(curElement, host, false)
                    } else {
                        curElement.addClass('blocked').find('action-menu-block').remove();
                        if (!this.blocklistNotification) {
                            curElement.addClass('blockedVisible');
                            this.addLink(curElement, host, true)
                        }
                    }
                }
            })
        })
    };

    addBlockListNotification() {
        $('#res').append(`<div id="blocklistNotification" dir="${i18n('textDirection')}">
                        ${i18n('blocklistNotification')}(<a href="javascript:;">${i18n('showBlockedLink')}</a>)</div>`);
        $('#blocklistNotification a').on('click', even => {
            $('.g').forEach((e,i) => {
                e = $(e);
                if(e.hasClass('blocked')){
                    e.toggleClass('blockedVisible').find('.action-menu-block').remove();
                    this.addLink(e, this.linkList[i], this.blocklistNotification);
                    even.target.innerText = i18n(this.blocklistNotification ? 'cancel' : 'showBlockedLink');
                }
            });
            this.blocklistNotification = !this.blocklistNotification;
        })
    }

    extractSubDomains_(pattern) {
        const subDomains = [];
        const parts = pattern.split('.');
        for (let i = parts.length - 2; i >= 0; --i) {
            subDomains.push(parts.slice(i).join('.'));
        }
        return subDomains;
    };

    findBlockPatternForHost_(hostName, hostList = this.blockList) {
        let matchedPattern = '';
        // Match each level of subdomains against the blocklist. For example, if
        // a.com is blocked, b.a.com should be hidden from search result.
        const subdomains = this.extractSubDomains_(hostName);
        subdomains.some(e => {
            if (hostList[e]) {
                matchedPattern = e;
                return true;
            }
        });
        return matchedPattern;
    };

    modifySearchResults_() {
        if (this.IsPwsDisabled_()) return;

        let processedSearchResultList = $('.pb');

        // Add blocklist links to search results until all have been processed.
        if (processedSearchResultList.length < searchElement.length) {
            searchElement.forEach(e => {
                e = $(e);
                const host = Action.getDomain(e);
                this.linkList.push(host);
                if (this.findBlockPatternForHost_(host)) {
                    e.addClass('blocked');
                    this.blockNum++
                } else {
                    this.addLink(e, host, false);
                }
            });
            console.log(this.blockNum);
            if (this.blockNum) this.addBlockListNotification();
        }
    };

    IsPwsDisabled_() {
        return document.URL.match(blocklist.PWS_REGEX) !== null;
    };

    getEventId_() {
        blocklist.eventId = 'null';
        try {
            var head = document.getElementsByTagName('head')[0];
            var scripts = head.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                var match = script.text.match(blocklist.EVENT_ID_REGEX);
                if (match) {
                    blocklist.eventId = match[1];
                }
            }
        } catch (e) {
        }
    };
}

new Serp();