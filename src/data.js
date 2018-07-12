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
        return this.banDomain.add({domain: domain, time: 1}).then(() => ({success: 1}));
    }

    bulkAdd() {
        this.banDomain.bulkAdd([{name: "Foo"}, {name: "Bar"}]);
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

    delete(domain) {
        return this.banDomain.where("banDomain")
            .equals(domain)
            .delete()
            .then(deleteCount => ({success: deleteCount}));
    }

    pagination(page, num = 20) {
        return this.banDomain
            .where('id')
            .inAnyRange([num * (page - 1), num * page]).toArray();
    }
}