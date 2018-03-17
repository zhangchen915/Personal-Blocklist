const blocklist = {
    common: {
        GETBLOCKLIST: 'getBlocklist',
        ADDTOBLOCKLIST: 'addToBlocklist',
        ADDBULKTOBLOCKLIST: 'addBulkToBlocklist',
        DELETEFROMBLOCKLIST: 'deleteFromBlocklist',
        FINISHEXPORT: 'finishExport'
    }
};

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

        this.refreshBlocklist().then(() => {
                this.modifySearchResults_();
            }
        );
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
                        ${i18n('blocklistNotification')}(<a id="toggleNotification" href="javascript:;">${i18n('showBlockedLink')}</a>)</div>`);
        $('#toggleNotification').on('click', even => {
            $('.g').forEach((e, i) => {
                e = $(e);
                if (e.hasClass('blocked')) {
                    e.toggleClass('blockedVisible').find('.action-menu-block').remove();
                    this.addLink(e, this.linkList[i], this.blocklistNotification);
                    even.target.innerText = i18n(this.blocklistNotification ? 'cancel' : 'showBlockedLink');
                }
            });
            this.blocklistNotification = !this.blocklistNotification;
        })
    }

    extractSubDomains(pattern) {
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
        this.extractSubDomains(hostName).some(e => {
            if (hostList[e]) {
                matchedPattern = e;
                return true;
            }
        });
        return matchedPattern;
    };

    modifySearchResults_() {
        const processedSearchResultList = $('.pb');
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
}

new Serp();