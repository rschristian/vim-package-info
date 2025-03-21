import fs from 'node:fs';
import path from 'node:path';
import toml from 'toml';

const LANGUAGE = 'python:pyproject.toml';
const depGroups = ['dependencies', 'dev-dependencies'];
export const markers = [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]];
export const nameRegex = /['|"]?([a-zA-Z0-9\-_]*)['|"]? *=.*/;

export class Parser {
    /**
     * @param {import('../store.js').Store} store
     */
    constructor(store) {
        this.store = store;
    }

    /**
     * @param {string} bufferContent
     * @return {string[]}
     */
    getDeps(bufferContent) {
        const data = toml.parse(bufferContent)['tool']['poetry'];
        const depList = [];

        for (let dg of depGroups) {
            if (dg in data)
                for (let dep in data[dg]) {
                    this.store.set(LANGUAGE, dep, { semverVersion: data[dg][dep] });
                    depList.push(dep);
                }
        }

        return depList;
    }

    /**
     * @param {string[]} depList
     */
    async updatePackageVersions(depList) {
        for (let dep of depList) {
            if ('latest' in this.store.get(LANGUAGE, dep)) return;

            const res = await fetch(`https://pypi.org/pypi/${dep}/json`, {
                headers: {
                    'User-Agent': 'vim-package-info (github.com/rschristian/vim-package-info)',
                }
            });

            // TODO: Figure out proper error handling for rplugins
            if (!res.ok) return;
            const data = await res.json();

            const latest = data.info.version;
            const versions = Object.keys(data['releases']);
            this.store.set(LANGUAGE, dep, { latest, versions });
        }
    }

    /**
     * @param {string[]} depList
     * @param {string} filePath
     */
    updateCurrentVersions(depList, filePath) {
        const dir = path.dirname(filePath);
        const lock_filename = path.join(dir, 'poetry.lock');

        if (fs.existsSync(lock_filename)) {
            const lockfile_content = toml.parse(fs.readFileSync(lock_filename, 'utf-8'));
            for (let pack of lockfile_content['package']) {
                this.store.set(LANGUAGE, pack.name, {
                    currentVersion: pack.version || null,
                });
            }
        }
    }
}
