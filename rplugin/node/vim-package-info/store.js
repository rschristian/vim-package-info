/**
 * @typedef {import('./types.d.ts').ParserKey} ParserKey
 * @typedef {import('./types.d.ts').StoreItem} StoreItem
 */

const emptyStore = {
    'javascript:package.json': {},
    'python:pipfile': {},
    'python:pyproject.toml': {},
    'python:requirements.txt': {},
    'rust:cargo.toml': {},
};

const stringifiedEmptyStore = JSON.stringify(emptyStore);

// A super minimal store implementation
class Store {
    /** @type {Record<ParserKey, Record<string, any>>} */
    store = JSON.parse(stringifiedEmptyStore);

    /**
     * @param {ParserKey} lang
     * @param {string} dep
     * @return {Partial<StoreItem> | undefined}
     */
    get(lang, dep) {
        return this.store[lang][dep];
    }

    /**
     * @param {ParserKey} lang
     * @param {string} dep
     * @param {Partial<StoreItem>} value
     * @return {void}
     */
    set(lang, dep, value) {
        this.store[lang][dep] = {
            ...this.store[lang][dep],
            ...value,
        };
    }

    reset() {
        this.store = JSON.parse(stringifiedEmptyStore);
    }
}

export const store = new Store();
