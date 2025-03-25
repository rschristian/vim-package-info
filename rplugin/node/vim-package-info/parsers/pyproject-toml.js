import { promises as fs } from 'node:fs';
import path from 'node:path';
import toml from 'toml';

import { store } from '../store.js';

const LANGUAGE = 'python:pyproject.toml';
const depGroups = ['dependencies', 'dev-dependencies'];
const markers = [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]];
const nameRegex = /['|"]?([a-zA-Z0-9\-_]*)['|"]? *=.*/;

/**
 * @typedef {import('../store.js').StoreItem} StoreItem
 */

/**
 * @type {import('../types.d.ts').PackageFileParser}
 */
export const PyprojectTomlParser = {
    getLockFile: async (packageFilePath) => {
        const dir = path.resolve(path.dirname(packageFilePath));
        const lockFilePath = path.join(dir, 'poetry.lock');
        const lockFileContent = await fs.readFile(lockFilePath, 'utf-8');

        return { lockFilePath, lockFileContent };
    },
    getDepsFromPackageFile: (packageFileContent) => {
        const data = toml.parse(packageFileContent)['tool']['poetry'];
        const depList = [];

        for (const depGroup of depGroups) {
            if (!(depGroup in data)) continue;

            for (const dep in data[depGroup]) {
                const semverVersion = data[depGroup][dep]?.version || data[depGroup][dep];
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

                const res = await fetch(`https://pypi.org/pypi/${dep}/json`, {
                    headers: {
                        'User-Agent': 'vim-package-info (github.com/rschristian/vim-package-info)',
                    }
                });

                // TODO: Figure out proper error handling for rplugins
                if (!res.ok) return;
                const data = await res.json();

                const latestVersion = data.info.version;
                const allVersions = Object.keys(data['releases']);

                store.set(LANGUAGE, dep, { latestVersion, allVersions });
                if (cb) cb(dep, /** @type {Partial<StoreItem>} */ (store.get(LANGUAGE, dep)), markers, nameRegex);
            }
        };

        await Promise.all(
            Array(5).fill(depList.values()).map(updatePackageVersions)
        );
    },
    getLockFileVersions: async (depList, packageFilePath, lockFilePath, lockFileContent, cb) => {
        const parsedLockfile = toml.parse(lockFileContent);

        for (const dep of depList) {
            const pack = parsedLockfile['package'].find((p) => p.name === dep);

            store.set(LANGUAGE, dep, {
                currentVersion: pack.version || null,
            });
            if (cb) cb(dep, /** @type {Partial<StoreItem>} */ (store.get(LANGUAGE, dep)), markers, nameRegex);
        }
    }
};
