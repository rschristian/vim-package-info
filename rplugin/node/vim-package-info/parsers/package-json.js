import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import lockfile from '@yarnpkg/lockfile';

import { initialStore } from '../store.js';
import { drawOne } from '../render.js';
import { getDepLines } from '../render-utils.js';

const LANGUAGE = 'javascript';
const depGroups = /** @type {Array<keyof initialStore[LANGUAGE]>} */ (Object.keys(initialStore[LANGUAGE]));
const markers = depGroups.map((prop) => [new RegExp(`["|'](${prop})["|']`), /\}/]);
const nameRegex = /['|"](.*)['|"] *:/;

export class PackageJson {
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
        const packageJsonData = JSON.parse(bufferContent);
        const depList = [];

        for (const depGroup of depGroups) {
            if (!(depGroup in packageJsonData)) continue;

            for (const dep in packageJsonData[depGroup]) {
                this.store.set(LANGUAGE, depGroup, dep, { semverVersion: packageJsonData[depGroup][dep] });
                depList.push(dep);
            }
        }

        return depList;
    }

    /**
     * @param {string[]} depList
     */
    updatePackageVersions(depList) {
        const updatePackageVersion = async (iter) => {
            for (const dep of iter) {
                const res = await fetch(`https://registry.npmjs.org/${dep}`, {
                    headers: {
                        'User-Agent': 'vim-package-info (github.com/rschristian/vim-package-info)',
                    },
                });

                const { semverVersion } = this.store.get(LANGUAGE, dep);
                if (/^(http[s]*|file):\/\//.test(semverVersion)) return; // don't bother checking in this case

                // TODO: Figure out proper error handling
                if (!res.ok) return;
                const data = await res.json();

                let latest = null,
                    versions = null;

                if ('dist-tags' in data && 'latest' in data['dist-tags'])
                    latest = data['dist-tags']['latest'];
                if ('versions' in data) versions = Object.keys(data['versions']);

                this.store.set(LANGUAGE, dep, { latest, versions });
            }
        };

        Promise.all(Array(5).fill(depList).map(updatePackageVersion));
    }

    updateCurrentVersions(depList, filePath) {
        let found = false;
        let dir = path.resolve(path.dirname(filePath));

        do {
            const npmLockFile = path.join(dir, 'package-lock.json');
            const yarnLockFile = path.join(dir, 'yarn.lock');
            const pnpmLockFile = path.join(dir, 'pnpm-lock.yaml');

            if (fs.existsSync(npmLockFile)) {
                found = true;
                const lockfile = JSON.parse(fs.readFileSync(npmLockFile, 'utf-8'));
                for (const dep of depList) {
                    for (const depGroup of depGroups) {
                        this.store.set(LANGUAGE, dep, {
                            currentVersion: parseNPM(lockfile, depGroup, dep),
                        });
                        break;
                    }
                }
            } else if (fs.existsSync(yarnLockFile)) {
                found = true;
                const lockfile_content = lockfile.parse(fs.readFileSync(yarnLockFile, 'utf-8'));
                for (let dep of depList) {
                    for (let ld of Object.keys(lockfile_content['object'])) {
                        if (ld.split('@')[0] === dep) {
                            const current_version = lockfile_content['object'][ld].version;
                            this.store.set(LANGUAGE, dep, {
                                current_version,
                            });
                        }
                    }
                }
            } else if (fs.existsSync(pnpmLockFile)) {
                found = true;
                const lockfile_content = yaml.parse(fs.readFileSync(pnpmLockFile, 'utf-8'));
                for (let dep of depList) {
                    for (let dg of depGroups) {
                        if (dg in lockfile_content && dep in lockfile_content[dg]) {
                            let current_version =
                                lockfile_content[dg][dep]['version'].match(/([^\(]+)/);
                            current_version = current_version ? current_version[1] : null;
                            this.store.set(LANGUAGE, dep, {
                                current_version,
                            });
                            break;
                        }
                    }
                }
            } else {
                dir = path.dirname(dir);
            }
        } while (!found && dir !== path.dirname(dir));
    }

    async render(handle, dep) {
        const buffer = await handle.nvim.buffer;
        const bufferLines = await buffer.getLines();

        const info = this.store.get(LANGUAGE, dep);

        const lineNumbers = getDepLines(bufferLines, markers, nameRegex, dep);
        for (let ln of lineNumbers) {
            await drawOne(handle, ln, info.current_version, info.latest);
        }
    }
}

/**
 * @param {Record<string, any>} lockfile
 * @param {string} depGroup
 * @param {string} dep
 */
function parseNPM(lockfile, depGroup, dep) {
    // v2 is a combined v1 & v3 lockfile, so our parsing for v1 works for v2 as well
    if (lockfile['lockfileVersion'] !== 3) {
        if (depGroup in lockfile && dep in lockfile[depGroup]) {
            return lockfile[depGroup][dep]['version'] || null;
        }
    }

    const pkgKey = `node_modules/${dep}`;
    if (
        pkgKey in lockfile['packages'] && depGroup === 'dependencies'
            ? lockfile['packages'][pkgKey]['dev'] === undefined
            : lockfile['packages'][pkgKey]['dev'] === true
    ) {
        return lockfile['packages'][pkgKey]['version'] || null;
    }
}

function parseYarn() {}

function parsePNPM() {}
