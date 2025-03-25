import { promises as fs } from 'node:fs';
import path from 'node:path';
import yarnParse  from '@yarnpkg/lockfile';
import { parse as yamlParse } from 'yaml';

import { store } from '../store.js';

const LANGUAGE = 'javascript:package.json';
const depGroups = ['dependencies', 'devDependencies'];
const markers = depGroups.map((prop) => [new RegExp(`["|'](${prop})["|']`), /\}/]);
const nameRegex = /['|"](.*)['|"] *:/;

/**
 * @typedef {import('../store.js').StoreItem} StoreItem
 * @typedef {import('../types.d.ts').RenderCallback} RenderCallback
 */

/**
 * @type {import('../types.d.ts').PackageFileParser}
 */
export const PkgJsonParser = {
    getLockFile: async (packageFilePath) => {
        let dir = path.resolve(path.dirname(packageFilePath));

        do {
            const files = (await fs.readdir(dir)).filter((f) => (f == 'package-lock.json' || f == 'yarn.lock' || f == 'pnpm-lock.yaml'));

            if (!files.length) {
                dir = path.dirname(dir);
                continue;
            }

            // Only one lockfile should exist at a time, don't bother trying to support more
            const lockFilePath = path.join(dir, files[0]);
            const lockFileContent = await fs.readFile(lockFilePath, 'utf-8');

            return { lockFilePath, lockFileContent };
        } while (path.dirname(dir) !== dir);

        throw new Error('No lockfile found');
    },
    getDepsFromPackageFile: (packageFileContent) => {
        const data = JSON.parse(packageFileContent);
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

                store.set(LANGUAGE, dep, { semverVersion });
                depList.push(dep);
            }
        }

        return depList;
    },
    getRegistryVersions: async (depList, cb) => {
        const updatePackageVersions = async (iter) => {
            for (const dep of iter) {
                const stored = store.get(LANGUAGE, dep);
                if (stored && 'latestVersion' in stored && 'allVersions' in stored) continue;

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

                let latestVersion = '',
                    allVersions = /** @type {string[]} */ ([]);
                if ('dist-tags' in data && 'latest' in data['dist-tags']) {
                    latestVersion = data['dist-tags']['latest'];
                }

                // TODO: Unused for the moment but could be used to show alts
                // when a major version behind or something
                if ('versions' in data) {
                    allVersions = Object.keys(data['versions']);
                }

                store.set(LANGUAGE, dep, { latestVersion, allVersions });
                if (cb) cb(dep, /** @type {Partial<StoreItem>} */ (store.get(LANGUAGE, dep)), markers, nameRegex);
            }
        };

        await Promise.all(
            Array(5).fill(depList.values()).map(updatePackageVersions)
        );
    },
    getLockFileVersions: async (depList, packageFilePath, lockFilePath, lockFileContent, cb) => {
        const relativePackageFilePath = path.relative(path.dirname(lockFilePath), path.dirname(packageFilePath)) || '.';

        switch (path.basename(lockFilePath)) {
            case 'package-lock.json': {
                return parseNPM(store, lockFileContent, depList, relativePackageFilePath, cb);
            }
            case 'yarn.lock': {
                return parseYarn(store, lockFileContent, depList, cb);
            }
            case 'pnpm-lock.yaml': {
                return parsePNPM(store, lockFileContent, depList, relativePackageFilePath, cb);
            }
        }
    }
};

/**
 * @param {typeof store} store
 * @param {string} lockfile
 * @param {string[]} depList
 * @param {string} relativePackageFilePath
 * @param {RenderCallback} [cb]
 */
function parseNPM(store, lockfile, depList, relativePackageFilePath, cb) {
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
        if (cb) cb(dep, /** @type {Partial<StoreItem>} */ (store.get(LANGUAGE, dep)), markers, nameRegex);
    }
}

/**
 * @param {typeof store} store
 * @param {string} lockfile
 * @param {string[]} depList
 * @param {RenderCallback} [cb]
 */
function parseYarn(store, lockfile, depList, cb) {
    const parsedLockfile = yarnParse.parse(lockfile);

    for (const dep of depList) {
        for (const id of Object.keys(parsedLockfile['object'])) {
            if (id.match(/^@[^@]+|[^@]+/)[0] === dep) {
                const currentVersion = parsedLockfile['object'][id].version;
                store.set(LANGUAGE, dep, { currentVersion });
                if (cb) cb(dep, /** @type {Partial<StoreItem>} */ (store.get(LANGUAGE, dep)), markers, nameRegex);
            }
        }
    }
}

/**
 * @param {typeof store} store
 * @param {string} lockfile
 * @param {string[]} depList
 * @param {string} relativePackageFilePath
 * @param {RenderCallback} [cb]
 */
function parsePNPM(store, lockfile, depList, relativePackageFilePath, cb) {
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
            if (cb) cb(dep, /** @type {Partial<StoreItem>} */ (store.get(LANGUAGE, dep)), markers, nameRegex);
        }
    }
}
