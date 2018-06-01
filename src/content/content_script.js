import {addClass, removeClass, hasClass} from 'dom-helpers/class'
import {$, parseHTML, extractSubDomains} from './util'
import './main.css'

const COMMON = {
    GETBLOCKLIST: 'getBlocklist',
    ADDTOBLOCKLIST: 'addToBlocklist',
    ADDBULKTOBLOCKLIST: 'importBlocklist',
    DELETEFROMBLOCKLIST: 'deleteFromBlocklist',
    ADDTIME: 'addTime',
    FINISHEXPORT: 'finishExport'
};
const searchElement = $('#search').querySelectorAll('.g');
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
        return blockState ? Action.sendCmd(COMMON.DELETEFROMBLOCKLIST, pattern) :
            Action.sendCmd(COMMON.ADDTOBLOCKLIST, pattern);
    }

    static getDomain(searchResult) {
        return searchResult.querySelector('h3 > a').href.replace(new RegExp('^https?://(www[.])?([0-9a-zA-Z.-]+).*$'), '$2');
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
        return Action.sendCmd(COMMON.GETBLOCKLIST).then(response => {
                if (response.blocklist) return this.blockList = response.blocklist;
            }
        );
    };

    addLink(searchResult, host, blockState) {
        const ol = searchResult.querySelector('ol');
        if (!ol) return;
        ol.append(parseHTML(`<li class="action-menu-item action-menu-block">
                                        <a class="fl" href="javascript:;" 
                                        title="${host}">${i18n(blockState ? 'unblockLinkPrefix' : 'blockLinkPrefix')}</a></li>`));
        const menu = searchResult.querySelector('.action-menu-block');
        menu.addEventListener('click', () => {
            Action.blocklistPattern(host, blockState).then(() => {
                this.refreshBlocklist()
            });
            menu.remove();

            this.linkList.forEach((link, i) => {
                const curElement = searchElement[i];
                if (host === link.split('.').slice(-host.split('.').length).join('.')) {
                    //TODO states.blocklistNotification
                    if (blockState) {
                        removeClass(curElement, 'blocked');
                        removeClass(curElement, 'blockedVisible');
                        this.addLink(curElement, host, false)
                    } else {
                        addClass(curElement, 'blocked');
                        if (!this.blocklistNotification) {
                            addClass(curElement, 'blockedVisible');
                            this.addLink(curElement, host, true)
                        }
                    }
                }
            })
        })
    };

    addBlockListNotification() {
        $('#res').append(parseHTML(`<div id="blocklistNotification" dir="${i18n('textDirection')}">
                        ${i18n('blocklistNotification')}(<a id="toggleNotification" href="javascript:;">${i18n('showBlockedLink')}</a>)</div>`));
        $('#toggleNotification').addEventListener('click', even => {
            document.querySelectorAll('.g').forEach((e, i) => {
                if (hasClass(e, 'blocked')) {
                    const block = e.querySelector('.action-menu-block');
                    hasClass(e, 'blockedVisible') ? removeClass(e, 'blockedVisible') : addClass(e, 'blockedVisible');
                    if (block) block.remove();
                    this.addLink(e, this.linkList[i], this.blocklistNotification);
                    even.target.innerText = i18n(this.blocklistNotification ? 'cancel' : 'showBlockedLink');
                }
            });
            this.blocklistNotification = !this.blocklistNotification;
        })
    }

    findBlockPatternForHost_(hostName, hostList = this.blockList) {
        let matchedPattern = '';
        extractSubDomains(hostName).some(e => {
            if (hostList[e]) {
                matchedPattern = e;
                return true;
            }
        });
        return matchedPattern;
    };

    modifySearchResults_() {
        const processedSearchResultList = document.querySelectorAll('.pb');
        if (processedSearchResultList.length < searchElement.length) {
            searchElement.forEach(e => {
                const host = Action.getDomain(e);
                this.linkList.push(host);
                if (this.findBlockPatternForHost_(host)) {
                    addClass(e, 'blocked');
                    Action.sendCmd(COMMON.ADDTIME, host);
                    this.blockNum++
                } else {
                    this.addLink(e, host, false);
                }
            });
            if (this.blockNum) this.addBlockListNotification();
        }
    };
}

new Serp();