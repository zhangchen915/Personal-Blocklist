import Dexie from 'dexie';

export class Domain {
    constructor() {
        this.db = new Dexie("GB");
        this.db.version(2).stores({
            banDomain: "++id, &domain, time"
        });

        this.banDomain = this.db.banDomain;
    }

    count() {
        return this.banDomain.count();
    }

    add(domain) {
        return this.banDomain.add({domain: domain, time: 1});
    }

    delete(domain) {
        return this.banDomain.where("domain")
            .equals(domain)
            .delete()
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
        return this.banDomain.where("domain")
            .equals(domain)
            .modify(e => e.time++)
    }

    remove(ids) {
        return this.banDomain.bulkDelete(ids);
    }

    pagination(state) {
        const {page, rowsPerPage} = state;
        return this.banDomain
            .where('id')
            .inAnyRange([[rowsPerPage * page, rowsPerPage * (page + 1)]])
            .toArray();
    }
}