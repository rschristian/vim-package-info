import { store } from '../store.js';

const LANGUAGE = 'python:requirements.txt';
const markers = null;
const nameRegex = /^ *([a-zA-Z_]+[a-zA-Z0-9\-_]*).*/;

/**
 * @typedef {import('../store.js').StoreItem} StoreItem
 */

/**
 * @type {import('../types.d.ts').PackageFileParser}
 */
export const RequirementsTxtParser = {
    getLockFile: async (packageFilePath) => {
        return { lockFilePath: null, lockFileContent: null };
    },
    getDepsFromPackageFile: (packageFileContent) => {
        const depList = [];

        for (let line of packageFileContent.split('\n')) {
            const vals = line.match(nameRegex);
            if (vals !== null && vals !== undefined && 1 in vals) {
                const dep = vals[1].trim();
                let semverVersion = null;

                const versionPart = line.split('==')[1];
                if (versionPart) {
                    const versionMatches = versionPart.match(/(\d+\.)?(\d+\.)?(\*|\d+)/);
                    if (versionMatches.length > 0) {
                        semverVersion = versionMatches[0];
                    }
                }

                store.set(LANGUAGE, dep, {
                    semverVersion,
                    currentVersion: semverVersion,
                });
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
                    },
                });

                if (!res.ok) {
                    // Do we want to print out errors? Silence might be preferable
                    //errWriteLine(`Failed to fetch package info for ${dep}, status: ${res.status}, ${res.statusText}`);
                    return;
                }
                const data = await res.json();

                const latestVersion = data.info.version;
                const allVersions = Object.keys(data['releases']);

                store.set(LANGUAGE, dep, { latestVersion, allVersions });
                if (cb) cb(dep, store.get(LANGUAGE, dep), markers, nameRegex);
            }
        };

        await Promise.all(Array(5).fill(depList.values()).map(updatePackageVersions));
    },
    getLockFileVersions: async (depList, packageFilePath, lockFilePath, lockFileContent, cb) => {
        // There's no specific lockfile so currentVersion is the same as semverVersion and
        // set in getDepsFromPackageFile to skip an extra iteration
    },
};
