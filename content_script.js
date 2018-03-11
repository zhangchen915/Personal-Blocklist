/**
 * Namespace for the content script functions for Google search result pages.
 * @const
 */
blocklist.serp = {};

/**
 * List of the search results tags on Google SERP.
 * @type {[string]}
 */
blocklist.serp.SEARCH_RESULT_TAGS = ['li', 'div'];

/**
 * Class of the search results on Google SERP.
 * @type {string}
 */
blocklist.serp.SEARCH_RESULT_CLASS = 'g';

/**
 * Class to add to a search result after it was processed by the extension.
 * @type {string}
 */
blocklist.serp.PERSONAL_BLOCKLIST_CLASS = 'pb';

/**
 * Class of blocked search results.
 * @type {string}
 */
blocklist.serp.BLOCKED_SEARCH_RESULT_CLASS = 'blocked';

/**
 * Class of blocked search results that were requested to be shown.
 * @type {string}
 */
blocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_CLASS = 'blockedVisible';

/**
 * Class of a element that holds block/unblock links.
 * @type {string}
 */
blocklist.serp.BLOCK_LINK_CLASS = 'fl';

/**
 * Class of the search result bodies on Google SERP.
 * @type {string}
 */
blocklist.serp.SEARCH_RESULT_BODY_CLASS = 's';

/**
 * Class of the search results lower links on Google SERP.
 * @type {string}
 */
blocklist.serp.SEARCH_RESULT_LOWER_LINKS_CLASS = 'gl';

/**
 * Class that contains the cite tag on Google SERP.
 * @type {string}
 */
blocklist.serp.SEARCH_RESULT_CITE_DIV_CLASS = 'kv';

/**
 * Class of the short (snippet-less) search results links on Google SERP.
 * @type {string}
 */
blocklist.serp.SEARCH_RESULT_SHORT_LINKS_CLASS = 'vshid';

/**
 * Class of lower links span for definition-like results (e.g. query "viagra").
 * @type {string}
 */
blocklist.serp.DEFINITION_RESULT_LOWER_LINKS_CLASS = 'a';

/**
 * Class of book search result table cell, used to identify book search results.
 * @type {string}
 */
blocklist.serp.BOOK_SEARCH_RESULT_CLASS = 'bkst';

/**
 * Class of the search results block div.
 * @type {string}
 */
blocklist.serp.SEARCH_RESULT_BLOCK_CLASS = 'ires';

/**
 * Class name that identifies gws-side block links.
 * @type {string}
 */
blocklist.serp.GWS_BLOCK_LINK_CLASS = 'kob';

/**
 * Class name that identifies showed gws-side block links.
 * @type {string}
 */
blocklist.serp.SHOWED_GWS_BLOCK_LINK_CLASS = 'kobb';

/**
 * The interval between attempts to apply blocklist feats to SERP, in millisecs.
 * @type {number}
 */
blocklist.serp.REPEAT_INTERVAL_IN_MS = 500;

/**
 * Type of refresh request.
 * @type {string}
 */
blocklist.serp.REFRESH_REQUEST = 'refresh';

/**
 * A regular expression to deal with redirections through Google services,
 * e.g. for translated results like
 * http://translate.google.com/translate?u=http://example.com
 * @type {RegExp}
 */
blocklist.serp.REDIRECT_REGEX = new RegExp(
    '^(https?://[a-z.]+[.]?google([.][a-z]{2,4}){1,2})?/' +
    '[a-z_-]*[?]((img)?u|.*&(img)?u)(rl)?=([^&]*[.][^&]*).*$');

/**
 * A regular expression to check if personalized web search is disabled in url.
 * @type {RegExp}
 */
blocklist.serp.PWS_REGEX = new RegExp('(&|[?])pws=0');

/**
 * Matches the kEI javascript property defined in the header of the Google SRP.
 * @type {RegExp}
 */
blocklist.serp.EVENT_ID_REGEX = new RegExp('kEI\\:"([^"]+)"');

/**
 * The blocklisted patterns. Call blocklist.serp.refreshBlocklist to populate.
 * @type {Array.<string>}
 */
blocklist.serp.blocklist = [];
blocklist.serp.linklist = [];

/**
 * The event id of the search result page.
 * @type {string}
 */
blocklist.serp.eventId = '';

/**
 * Whether the current search result page is https page.
 * The extension will not send info back to google via gen204 request if user is
 * under https page.
 * @type {bool}
 */
blocklist.serp.isHttps = !!document.URL.indexOf('https://');
const searchElement = $('.g');
const getMessage = chrome.i18n.getMessage;
const states = {
    blocklistNotification: true,
};

const actions = {
    sendMessage: (cmd, pattern) => {
        chrome.runtime.sendMessage({
            type: cmd,
            pattern: pattern,
            ei: blocklist.serp.eventId,
            enc: blocklist.serp.isHttps
        }, response => {
            if (response.success) {
                blocklist.serp.refreshBlocklist();
                blocklist.serp.needsRefresh = true;
            }
        })
    },
    addBlocklistPattern: pattern => {
        actions.sendMessage(blocklist.common.ADDTOBLOCKLIST, pattern);
    },
    removeBlocklistPattern: pattern => {
        actions.sendMessage(blocklist.common.DELETEFROMBLOCKLIST, pattern);
    },
    blocklistPattern: (pattern, blockState) => {
        blockState ? actions.removeBlocklistPattern(pattern) : actions.addBlocklistPattern(pattern);
    }
};

blocklist.serp.addLink = (searchResult, host, blockState) => {
    searchResult.find('ol').append(`<li class="action-menu-item ab_dropdownitem action-menu-block"><a class="fl" href="javascript:;" dir=${getMessage('textDirection')} title=${host}>
                    ${getMessage(blockState ? 'unblockLinkPrefix' : 'blockLinkPrefix')}</a></li>`);
    const menu = $(searchResult.find('.action-menu-block'));
    menu.on('click', () => {
        actions.blocklistPattern(host, blockState);
        menu.remove();

        blocklist.serp.linklist.forEach((link, i) => {
            const curElement = $(searchElement[i]);
            if (host === link.split('.').slice(-host.split('.').length).join('.')) {
                //TODO states.blocklistNotification
                if (blockState) {
                    curElement.removeClass('blocked blockedVisible');
                    blocklist.serp.addLink(curElement, host, false)
                } else {
                    curElement.addClass('blocked').find('action-menu-block').remove();
                    if (!states.blocklistNotification) {
                        curElement.addClass('blockedVisible');
                        blocklist.serp.addLink(curElement, host, true)
                    }
                }
            }
        })
    })
};

blocklist.serp.addBlockListNotification_ = () => {
    $('#res').append(`<div id="blocklistNotification" dir="${getMessage('textDirection')}">
                        ${getMessage('blocklistNotification')}(<a href="javascript:;">${getMessage('showBlockedLink')}</a>)</div>`);
    $('#blocklistNotification a').on('click', even => {
        $('.blocked').forEach(e => {
            e = $(e);
            e.toggleClass('blockedVisible');
            e.find('.action-menu-block').remove();
            blocklist.serp.addLink(e, blocklist.serp.parseDomainFromSearchResult_(e), states.blocklistNotification);
            even.target.innerText = getMessage(states.blocklistNotification ? 'cancel' : 'showBlockedLink');
        });
        states.blocklistNotification = !states.blocklistNotification;
    })
};

blocklist.serp.getNodes = className => {
    return $(`.${className}`);
};

blocklist.serp.parseDomainFromSearchResult_ = function (searchResult) {
    // Sometimes, the link is an intermediate step through another google service,
    // for example Google Translate. This regex parses the target url, so that we
    // don't block translate.google.com instead of the target host.
    return searchResult.find('h3 > a')[0].href.replace(blocklist.serp.REDIRECT_REGEX, '$7')
        .replace(blocklist.common.HOST_REGEX, '$2');
    // Identify domain by stripping protocol and path.
};

blocklist.serp.alterSearchResultNode_ = searchResult => {
    const host = blocklist.serp.parseDomainFromSearchResult_(searchResult);
    if (!host) return;

    blocklist.serp.findBlockPatternForHost_(host) ?
        searchResult.addClass('blocked') :
        blocklist.serp.addLink(searchResult, host, false);
};

blocklist.serp.extractSubDomains_ = function (pattern) {
    const subDomains = [];
    const parts = pattern.split('.');
    for (let i = parts.length - 2; i >= 0; --i) {
        subDomains.push(parts.slice(i).join('.'));
    }
    return subDomains;
};

blocklist.serp.findBlockPatternForHost_ = function (hostName, hostList = blocklist.serp.blocklist) {
    let matchedPattern = '';
    // Match each level of subdomains against the blocklist. For example, if
    // a.com is blocked, b.a.com should be hidden from search result.
    const subdomains = blocklist.serp.extractSubDomains_(hostName);
    subdomains.some(e => {
        if (hostList[e]) {
            matchedPattern = e;
            return true;
        }
    });
    return matchedPattern;
};

blocklist.serp.hideSearchResults = () => {
    searchElement.forEach(searchResult => {
        searchResult = $(searchResult);
        const matchedPattern = blocklist.serp.findBlockPatternForHost_(blocklist.serp.parseDomainFromSearchResult_(searchResult));
        if (matchedPattern &&
            ((searchResult.hasClass(blocklist.serp.BLOCKED_SEARCH_RESULT_CLASS) == false) &&
                (searchResult.hasClass(blocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_CLASS) == false))) {
            if (searchResult.hasClass(blocklist.serp.SHOWED_GWS_BLOCK_LINK_CLASS)) {
                searchResult.removeClass(blocklist.serp.BLOCKED_SEARCH_RESULT_CLASS)
                    .addClass(blocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_CLASS);
            } else {
                searchResult.addClass(blocklist.serp.BLOCKED_SEARCH_RESULT_CLASS);
            }
        }

        if (!matchedPattern) {
            if (searchResult.hasClass(blocklist.serp.BLOCKED_SEARCH_RESULT_CLASS) ||
                searchResult.hasClass(blocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_CLASS)) {
                searchResult.removeClass([blocklist.serp.BLOCKED_VISIBLE_SEARCH_RESULT_CLASS, blocklist.serp.BLOCKED_SEARCH_RESULT_CLASS]);
            }
        }
    })
};

/**
 * Iterates through search results, adding links and applying blocklist filter.
 * @private
 */
blocklist.serp.modifySearchResults_ = () => {
    // Skip if personalized web search was explicitly disabled (&pws=0).
    if (blocklist.serp.IsPwsDisabled_()) return;

    // Apply blocklist filter.
    if (blocklist.serp.blocklist.length > 0 || blocklist.serp.needsRefresh) {
        blocklist.serp.hideSearchResults();
    }
    let processedSearchResultList = blocklist.serp.getNodes(blocklist.serp.PERSONAL_BLOCKLIST_CLASS);

    // Add blocklist links to search results until all have been processed.
    if (blocklist.serp.needsRefresh || processedSearchResultList.length < searchElement.length) {
        searchElement.forEach(e => {
            e = $(e);
            const host = blocklist.serp.parseDomainFromSearchResult_(e);
            blocklist.serp.linklist.push(host);
            blocklist.serp.alterSearchResultNode_(e);
        });

        blocklist.serp.addBlockListNotification_();

        blocklist.serp.needsRefresh = false;
    }
};

/**
 * Retrieves blocklisted domains from localstorage.
 */
blocklist.serp.refreshBlocklist = () => {
    return new Promise(res => {
        chrome.runtime.sendMessage({type: blocklist.common.GETBLOCKLIST}, response => {
            if (response.blocklist) blocklist.serp.blocklist = response.blocklist;
            res(response.blocklist)
        });
    })
};

/**
 * Check if personalized web search is disabled (pws parameter is 0).
 * @return {boolean} True if url indicates personalized web search was disabled.
 * @private
 */
blocklist.serp.IsPwsDisabled_ = () => {
    return document.URL.match(blocklist.serp.PWS_REGEX) !== null;
};

/**
 * Get event id of this search result page.
 * @private
 */
blocklist.serp.getEventId_ = () => {
    blocklist.serp.eventId = 'null';
    try {
        var head = document.getElementsByTagName('head')[0];
        var scripts = head.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            var match = script.text.match(blocklist.serp.EVENT_ID_REGEX);
            if (match) {
                blocklist.serp.eventId = match[1];
            }
        }
    } catch (e) {
    }
};

/**
 * Exposes a listener, so that it can accept refresh request from manager.
 */
blocklist.serp.startBackgroundListeners = () => {
    chrome.extension.onRequest.addListener((request, sender, sendResponse) => {
        if (request.type == blocklist.serp.REFRESH_REQUEST) {
            blocklist.serp.refreshBlocklist();
            blocklist.serp.needsRefresh = true;
        } else if (request.type == blocklist.serp.EXPORTTOGOOGLE_REQUEST) {
            document.write(request.html);
            chrome.runtime.sendMessage({type: blocklist.common.FINISHEXPORT});
        }
    });
};

blocklist.serp.getEventId_();
blocklist.serp.refreshBlocklist().then(() => {
        blocklist.serp.modifySearchResults_();
        blocklist.serp.startBackgroundListeners();
    }
);