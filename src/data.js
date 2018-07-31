import Dexie from 'dexie';

export class Domain {
    constructor() {
        this.db = new Dexie("GB");
        this.db.version(2).stores({
            banDomain: "++id, &domain, time"
        });

        this.banDomain = this.db.banDomain;
    }

    add(domain) {
        return this.banDomain.add({domain: domain, time: 1}).then(() => ({success: true}));
    }

    bulkAdd(domains) {
        return this.banDomain.bulkAdd(domains).then(() => ({success: true}));
    }

    find(domain) {
        return this.banDomain.get({domain: domain}).then(res => {
            return {success: !!res}
        })
    }

    findWithAddTime(domain) {
        return this.banDomain.where("banDomain")
            .equals(domain)
            .modify(e => e.time++)
            .then(() => ({success: true}))
    }

    remove(domain) {
        return this.banDomain.where("banDomain")
            .equals(domain)
            .delete()
            .then(deleteCount => ({success: deleteCount}));
    }

    pagination(state) {
        const {page, rowsPerPage} = state;
        return this.banDomain
            .where('id')
            .inAnyRange([[num * (page - 1), rowsPerPage * page]])
            .toArray().then(res => res);
    }
}