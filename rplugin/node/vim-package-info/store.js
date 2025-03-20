// A super minimal store implementation with callback on insert event
export class Store2 {
    constructor(initialValue = {}, callback) {
        this.store = initialValue;
        this.callback = callback;
    }

    get(lang = null, dep = null) {
        if (lang === null) return {};
        else if (dep === null) return this.store[lang][dep] || {};
        else return this.store[lang][dep];
    }

    set(lang, dep, value) {
        if (!(lang in this.store)) this.store[lang] = {};
        if (!(dep in this.store[lang])) this.store[lang][dep] = {};
        this.store[lang][dep] = {
            ...this.store[lang][dep],
            ...value,
        };
        this.callback(lang, dep, this.store[lang][dep]);
    }
}

export const initialStore = {
    'javascript': {},
    'python:pipfile': {},
    'python:pyproject': {},
    'python:requirements': {},
    'rust': {},
}

// A super minimal store implementation with callback on insert event
export class Store {
    store = initialStore;

    /**
     * @param {(lang: keyof initialStore, dep: string, value: Record<string, any>) => void} callbackFn
     */
    constructor(callbackFn) {
        this.callback = callbackFn;
    }

    /**
     * @template {keyof initialStore} L
     * @param {L} lang
     * @param {string} dep
     */
    get(lang, dep) {
        return this.store[lang][dep];
    }

    /**
     * @template {keyof initialStore} L
     * @param {L} lang
     * @param {string} dep
     * @param {{ semverVersion?: string, latest?: string, versions?: string[] }} value
     */
    set(lang, dep, value) {
        if (this.store[lang][dep] === undefined) {
            this.store[lang][dep] = {};
        }

        this.store[lang][dep] = {
            ...this.store[lang][dep],
            ...value,
        };

        if (this.store[lang][dep].latest) {
            this.callback(lang, dep, this.store[lang][dep]);
        }

    }
}
