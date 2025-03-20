import { promises as fs } from 'node:fs';
import path from 'node:path';
import yarnParse  from '@yarnpkg/lockfile';
import { parse as yamlParse } from 'yaml';

const LANGUAGE = 'javascript';
const depGroups = ['dependencies', 'devDependencies'];
export const markers = depGroups.map((prop) => [new RegExp(`["|'](${prop})["|']`), /\}/]);
export const nameRegex = /['|"](.*)['|"] *:/;

export class PackageJsonParser {
    /**
     * @param {import('../store.js').Store} store
     */
    constructor(store) {
        this.store = store;
    }

    /**
     * @param {string} bufferContent
     */
    getDeps(bufferContent) {
        const data = JSON.parse(bufferContent);
        const depList = [];

        for (const depGroup of depGroups) {
            if (!(depGroup in data)) continue;

            for (const dep in data[depGroup]) {
                this.store.set(LANGUAGE, dep, { semverVersion: data[depGroup][dep] });
                depList.push(dep);
            }
        }

        return depList;
    }

    /**
     * @param {string[]} depList
     */
    updatePackageVersions(depList) {
        const updatePackageVersions = async (iter) => {
            for (const dep of iter) {
                const { semverVersion } = this.store.get(LANGUAGE, dep);
                if (/^(http[s]*|file):\/\//.test(semverVersion)) return; // don't bother checking in this case

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

        Promise.all(Array(5).fill(depList).map(updatePackageVersions));
    }

    async updateCurrentVersions(depList, filePath) {
        let dir = path.resolve(path.dirname(filePath));

        do {
            const files = (await fs.readdir(dir)).filter((f) => (f == 'package-lock.json' || f == 'yarn.lock' || f == 'pnpm-lock.yaml'));

            for (const file of files) {
                const lockfile = await fs.readFile(path.join(dir, file), 'utf-8');

                switch (file) {
                    case 'package-lock.json': {
                        return parseNPM(lockfile, depList);
                    }
                    case 'yarn.lock': {
                        return parseYarn(lockfile, depList);
                    }
                    case 'pnpm-lock.yaml': {
                        return parsePNPM(lockfile, depList);
                    }
                    default: {
                        dir = path.dirname(dir);
                    }
                }
            }
        } while (path.dirname(dir) !== dir);
    }
}

/**
 * @param {string} lockfile
 * @param {string[]} depList
 */
function parseNPM(lockfile, depList) {
    const parsedLockfile = JSON.parse(lockfile);

    const version = parsedLockfile['parsedLockfileVersion'];
    for (let dep of depList) {
        for (let dg of depGroups) {
            if (version == 3) {
                const pkgKey = `node_modules/${dep}`;
                if (
                    pkgKey in parsedLockfile['packages'] && dg == 'dependencies'
                        ? parsedLockfile['packages'][pkgKey]['dev'] === undefined
                        : parsedLockfile['packages'][pkgKey]['dev'] === true
                ) {
                    global.store.set(LANGUAGE, dep, {
                        current_version:
                            parsedLockfile['packages'][pkgKey]['version'] || null,
                    });
                    break;
                }
            } else if (dg in parsedLockfile && dep in parsedLockfile[dg]) {
                global.store.set(LANGUAGE, dep, {
                    current_version: parsedLockfile[dg][dep]['version'] || null,
                });
                break;
            }
        }
    }
}

/**
 * @param {string} lockfile
 * @param {string[]} depList
 */
function parseYarn(lockfile, depList) {
    const parsedLockfile = yarnParse(lockfile);

    for (let dep of depList) {
        for (let ld of Object.keys(parsedLockfile['object'])) {
            if (ld.match(/^@[^@]+|[^@]+/)[0] === dep) {
                const current_version = parsedLockfile['object'][ld].version;
                global.store.set(LANGUAGE, dep, {
                    current_version,
                });
            }
        }
    }
}

/**
 * @param {string} lockfile
 * @param {string[]} depList
 */
function parsePNPM(lockfile, depList) {
    const parsedLockfile = yamlParse(lockfile);

    for (let dep of depList) {
        for (let dg of depGroups) {
            if (dg in parsedLockfile && dep in parsedLockfile[dg]) {
                let current_version =
                    parsedLockfile[dg][dep]['version'].match(/([^\(]+)/);
                current_version = current_version ? current_version[1] : null;
                global.store.set(LANGUAGE, dep, {
                    current_version,
                });
                break;
            }
        }
    }
}
