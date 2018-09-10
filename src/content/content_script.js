import {$, parseHTML, Action, findBlockPatternForHost, handleVisibilityChange} from './util'
import './main.css'

const $g = $('#search').querySelectorAll('.g');
const $ires = $('#ires');
const i18n = chrome.i18n.getMessage;

class Serp {
    constructor() {
        this._blockNum = 0;
        this.linkList = [];
        this.blocklistNotification = true;
        this.modifySearchResults();
        this.evenDelegates();
    }

    set blockNum(val) {
        this.$blocklistNotification.classList[val ? 'add' : 'remove']('show');
        this._blockNum = val;
    }

    get blockNum() {
        return this._blockNum;
    }

    evenDelegates() {
        $ires.addEventListener('click', e => {
            if (e.target.matches('.action-button')) {
                let {host, block} = e.target.dataset;
                block = block === 'true';
                Action.blocklistPattern(host, block);
                this.linkList.forEach((link, i) => {
                    if (host === link.split('.').slice(-host.split('.').length).join('.')) {
                        this.blockNum += (block ? -1 : 1);
                        $g[i].classList[!block ? 'add' : 'remove']('blocked');
                        e.target.setAttribute("data-block", !block);
                        e.target.innerText = i18n(block ? 'blockLinkPrefix' : 'unblockLinkPrefix');
                    }
                })
            }
        })
    }

    addLink(searchResult, host, block) {
        const ol = searchResult.querySelector('ol');
        if (!ol) return;
        ol.append(parseHTML(`<li class="action-menu-item action-menu-block">
                                        <a class="fl action-button" data-host="${host}" data-block="${block}" href="javascript:;">${i18n(block ? 'unblockLinkPrefix' : 'blockLinkPrefix')}</a></li>`));
    };

    addBlockListNotification() {
        $ires.append(parseHTML(`<div id="blocklistNotification" dir="${i18n('textDirection')}">
                        ${i18n('blocklistNotification')}(<a id="toggleNotification" href="javascript:;">${i18n('showBlockedLink')}</a>)</div>`));
        this.$blocklistNotification = $('#blocklistNotification');
        this.$blocklistNotification.addEventListener('click', even => {
            $ires.classList.toggle('blockedVisible');
            even.target.innerText = i18n(this.blocklistNotification ? 'cancel' : 'showBlockedLink');
            this.blocklistNotification = !this.blocklistNotification;
        });
    }

    modifySearchResults() {
        this.addBlockListNotification();
        Promise.all(Array.from($g).map(async e => {
            const host = Action.getDomain(e);
            this.linkList.push(host);
            const block = await findBlockPatternForHost(host);

            if (block) {
                e.classList.add('blocked');
                this.blockNum += 1;
            }
            this.addLink(e, host, block);
        })).then(() => {
            handleVisibilityChange(this.blockNum);
            document.addEventListener("visibilitychange", () => {
                handleVisibilityChange(this.blockNum)
            }, false);
        })
    };
}

new Serp();