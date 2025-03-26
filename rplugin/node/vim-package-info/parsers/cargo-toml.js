import { promises as fs } from 'node:fs';
import path from 'node:path';
import toml from 'toml';

import { store } from '../store.js';

const LANGUAGE = 'rust:cargo.toml';
const depGroups = ['dependencies', 'build-dependencies', 'dev-dependencies'];
const markers = [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]];
const nameRegex = /([a-zA-Z0-9\-_]*) *=.*/;

/**
 * @typedef {import('../store.js').StoreItem} StoreItem
 */

/**
 * @type {import('../types.d.ts').PackageFileParser}
 */
export const CargoTomlParser = {
    getLockFile: async (packageFilePath) => {
        const dir = path.resolve(path.dirname(packageFilePath));
        const lockFilePath = path.join(dir, 'Cargo.lock');
        const lockFileContent = await fs.readFile(lockFilePath, 'utf-8');

        return { lockFilePath, lockFileContent };
    },
    getDepsFromPackageFile: (packageFileContent) => {
        const data = toml.parse(packageFileContent);
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

                const res = await fetch(`https://crates.io/api/v1/crates/${dep}`, {
                    headers: {
                        'User-Agent': 'vim-package-info (github.com/rschristian/vim-package-info)',
                    },
                });

                if (!res.ok) {
                    // Do we want to print out errors? Silence might be preferable
                    //errWriteLine(`Failed to fetch package info for ${dep}, status: ${res.status}, ${res.statusText}`);
                    return;
                }
                const data = await res.json();

                const latestVersion = data['crate'].max_version;
                const allVersions = data['versions'].map((v) => v.num);

                store.set(LANGUAGE, dep, { latestVersion, allVersions });
                if (cb) cb(dep, store.get(LANGUAGE, dep), markers, nameRegex);
            }
        };

        await Promise.all(Array(5).fill(depList.values()).map(updatePackageVersions));
    },
    getLockFileVersions: async (depList, packageFilePath, lockFilePath, lockFileContent, cb) => {
        const parsedLockfile = toml.parse(lockFileContent);

        for (const dep of depList) {
            const pack = parsedLockfile['package'].find((p) => p.name === dep);

            store.set(LANGUAGE, dep, {
                currentVersion: pack.version || null,
            });
            if (cb) cb(dep, store.get(LANGUAGE, dep), markers, nameRegex);
        }
    },
};
