import { promises as fs } from 'node:fs';
import path from 'node:path';
import yarnParse  from '@yarnpkg/lockfile';
import { parse as yamlParse } from 'yaml';

const LANGUAGE = 'javascript:package.json';
const depGroups = ['dependencies', 'devDependencies'];
export const markers = depGroups.map((prop) => [new RegExp(`["|'](${prop})["|']`), /\}/]);
export const nameRegex = /['|"](.*)['|"] *:/;

/**
 * @typedef {import('../store.js').Store} Store
 */

export class Parser {
    /**
     * @param {Store} store
     */
    constructor(store) {
        this.store = store;
    }

    /**
     * @param {string} bufferContent
     * @return {string[]}
     */
    getDeps(bufferContent) {
        const data = JSON.parse(bufferContent);
        const depList = [];

        for (const depGroup of depGroups) {
            if (!(depGroup in data)) continue;

            for (const dep in data[depGroup]) {
                const semverVersion = data[depGroup][dep];

                // We intentionally include packages with empty versions -- it's quite
                // handy when manually adding a package, the user won't have to manually
                // look up the latest version themselves.

                // There's seemingly no comprehensive list out there but _I think_ this roughly covers it?
                if (/^(https?|file|workspace|link):/.test(semverVersion)) continue;

                this.store.set(LANGUAGE, dep, { semverVersion });
                depList.push(dep);
            }
        }

        return depList;
    }

    /**
     * @param {string[]} depList
     */
    async updatePackageVersions(depList) {
        const updatePackageVersions = async (iter) => {
            for (const dep of iter) {
                const res = await fetch(`https://registry.npmjs.org/${dep}`, {
                    headers: {
                        // Returns abbreviated version, with a few less fields:
                        // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
                        Accept: 'application/vnd.npm.install-v1+json',
                        'User-Agent': 'vim-package-info (github.com/rschristian/vim-package-info)',
                    }
                });

                // TODO: Figure out proper error handling for rplugins
                if (!res.ok) return;
                const data = await res.json();

                let latest = null,
                    versions = null;
                if ('dist-tags' in data && 'latest' in data['dist-tags']) {
                    latest = data['dist-tags']['latest'];
                }

                // TODO: Unused for the moment but could be used to show alts
                // when a major version behind or something
                if ('versions' in data) {
                    versions = Object.keys(data['versions']);
                }

                this.store.set(LANGUAGE, dep, { latest, versions });
            }
        };

        await Promise.all(
            Array(5).fill(depList.values()).map(updatePackageVersions)
        );
    }

    /**
     * @param {string[]} depList
     * @param {string} filePath
     */
    async updateCurrentVersions(depList, filePath) {
        const packageFileDirName = path.dirname(filePath);
        let dir = path.resolve(packageFileDirName);

        do {
            const files = (await fs.readdir(dir)).filter((f) => (f == 'package-lock.json' || f == 'yarn.lock' || f == 'pnpm-lock.yaml'));

            if (!files.length) {
                dir = path.dirname(dir);
                continue;
            }

            // Only one lockfile should exist at a time, don't bother trying to support more
            const file = files[0];
            const lockfile = await fs.readFile(path.join(dir, file), 'utf-8');
            const relativePackageFilePath = path.relative(dir, packageFileDirName) || '.';

            switch (file) {
                case 'package-lock.json': {
                    return parseNPM(this.store, lockfile, depList, relativePackageFilePath);
                }
                case 'yarn.lock': {
                    return parseYarn(this.store, lockfile, depList);
                }
                case 'pnpm-lock.yaml': {
                    return parsePNPM(this.store, lockfile, depList, relativePackageFilePath);
                }
            }
        } while (path.dirname(dir) !== dir);
    }
}

/**
 * @param {Store} store
 * @param {string} lockfile
 * @param {string[]} depList
 * @param {string} relativePackageFilePath
 */
function parseNPM(store, lockfile, depList, relativePackageFilePath) {
    const parsedLockfile = JSON.parse(lockfile);

    const lockfileVersion = parsedLockfile['lockfileVersion'];

    for (const dep of depList) {
        let currentVersion = null;

        if (lockfileVersion >= 2) {
            // Need to support workspace packages resolving to non-root install locations
            let pkgKey = `${relativePackageFilePath}/node_modules/${dep}`;
            if (pkgKey in parsedLockfile['packages']) {
                currentVersion = parsedLockfile['packages'][pkgKey]['version'];
            }

            pkgKey = `node_modules/${dep}`;
            if (!currentVersion && pkgKey in parsedLockfile['packages']) {
                currentVersion = parsedLockfile['packages'][pkgKey]['version'];
            }
        } else if (dep in parsedLockfile['dependencies']) {
            currentVersion = parsedLockfile['dependencies'][dep]['version'];
        }

        store.set(LANGUAGE, dep, { currentVersion });
    }
}

/**
 * @param {Store} store
 * @param {string} lockfile
 * @param {string[]} depList
 */
function parseYarn(store, lockfile, depList) {
    const parsedLockfile = yarnParse.parse(lockfile);

    for (const dep of depList) {
        for (const id of Object.keys(parsedLockfile['object'])) {
            if (id.match(/^@[^@]+|[^@]+/)[0] === dep) {
                const currentVersion = parsedLockfile['object'][id].version;
                store.set(LANGUAGE, dep, { currentVersion });
            }
        }
    }
}

/**
 * @param {Store} store
 * @param {string} lockfile
 * @param {string[]} depList
 * @param {string} relativePackageFilePath
 */
function parsePNPM(store, lockfile, depList, relativePackageFilePath) {
    const parsedLockfile = yamlParse(lockfile);

    const importers = parsedLockfile.importers[relativePackageFilePath];
    const deps = depGroups.reduce((acc, key) => {
        return { ...acc, ...importers[key] };
    }, {});

    for (const dep of depList) {
        if (dep in deps) {
            let currentVersion = deps[dep]['version'].match(/([^\(]+)/);
            currentVersion = currentVersion ? currentVersion[1] : null;
            store.set(LANGUAGE, dep, { currentVersion });
        }
    }
}
