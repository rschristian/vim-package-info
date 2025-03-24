/**
 * @typedef {import('./types.d.ts').ParserKey} ParserKey
 * @typedef {import('./types.d.ts').StoreItem} StoreItem
 */

// A super minimal store implementation with callback on insert event
export class Store {
    /** @type {Record<ParserKey, Record<string, any>>} */
    store = {
        'javascript:package.json': {},
        'python:pipfile': {},
        'python:pyproject.toml': {},
        'python:requirements.txt': {},
        'rust:cargo.toml': {},
    };

    /**
     * @param {(lang: ParserKey, dep: string, value: Record<string, any>) => void} [callbackFn]
     */
    constructor(callbackFn) {
        this.callback = callbackFn;
    }

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
        if (this.store[lang][dep] === undefined) {
            this.store[lang][dep] = {};
        }

        this.store[lang][dep] = {
            ...this.store[lang][dep],
            ...value,
        };

        //this.callback(lang, dep, this.store[lang][dep]);
    }
}
