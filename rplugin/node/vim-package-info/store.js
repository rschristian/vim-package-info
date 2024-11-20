export const initialStore = {
    'python:requirements': {},
    'python:pipfile': {
        packages: {},
        'dev-packages': {},
    },
    'python:pyproject': {
        dependencies: {},
        'dev-dependencies': {},
    },
    'rust': {
        dependencies: {},
        'build-dependencies': {},
        'dev-dependencies': {},
    },
    'javascript': {
        dependencies: {},
        devDependencies: {},
    },
}

export class Store {
    store = initialStore;

    constructor(callback) {
        this.callback = callback;
    }

    get(lang, dep) {
        if (lang === null) return {};
        else if (dep === null) return this.store[lang][dep] || {};
        else return this.store[lang][dep];
    }

    /**
     * @template {keyof initialStore} L
     * @param {L} lang
     * @param {keyof initialStore[L]} depGroup
     * @param {string} dep
     * @param {Record<string, any>} value
     */
    set(lang, depGroup, dep, value) {
        if (this.store[lang][depGroup][dep] === undefined) {
            this.store[lang][depGroup][dep] = {};
        }

        this.store[lang][depGroup][dep] = {
            ...this.store[lang][depGroup][dep],
            ...value,
        };

        this.callback(lang, dep, this.store[lang][dep]);
    }
}
