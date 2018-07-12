import {addClass, removeClass, hasClass} from 'dom-helpers/class'
import {$, parseHTML, Action, findBlockPatternForHost} from './util'
import './main.css'

const searchElement = $('#search').querySelectorAll('.g');
const i18n = chrome.i18n.getMessage;

class Serp {
    constructor() {
        this.blockNum = 0;
        this.linkList = [];
        this.blocklistNotification = true;
        this.modifySearchResults();
    }

    addLink(searchResult, host, blockState) {
        const ol = searchResult.querySelector('ol');
        if (!ol) return;
        ol.append(parseHTML(`<li class="action-menu-item action-menu-block">
                                        <a class="fl" href="javascript:;" 
                                        title="${host}">${i18n(blockState ? 'unblockLinkPrefix' : 'blockLinkPrefix')}</a></li>`));
        const menu = searchResult.querySelector('.action-menu-block');
        menu.addEventListener('click', () => {
            Action.blocklistPattern(host, blockState);
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

    modifySearchResults() {
        Promise.all(Array.from(searchElement).map(async e => {
            const host = Action.getDomain(e);
            this.linkList.push(host);

            if (await findBlockPatternForHost(host)) {
                addClass(e, 'blocked');
                this.blockNum++
            } else {
                this.addLink(e, host, false);
            }
        })).then(() => {
            if (this.blockNum) this.addBlockListNotification();
        })
    };
}

new Serp();