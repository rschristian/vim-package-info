import { promises as fs } from 'node:fs';
import path from 'node:path';
import yarnParse  from '@yarnpkg/lockfile';
import { parse as yamlParse } from 'yaml';

import { fetcher } from '../utils.js';
import { drawOne } from '../render.js';
import { getDepLines } from '../render-utils.js';

const LANGUAGE = 'javascript';
const depGroups = ['dependencies', 'devDependencies'];
const markers = depGroups.map((prop) => [new RegExp(`["|'](${prop})["|']`), /\}/]);
const nameRegex = /['|"](.*)['|"] *:/;

export class PackageJson {
    getDeps(bufferContent) {
        const data = JSON.parse(bufferContent);
        const depList = [];

        for (let dg of depGroups) {
            if (dg in data)
                for (let dep in data[dg]) {
                    global.store.set(LANGUAGE, dep, { semver_version: data[dg][dep] });
                    depList.push(dep);
                }
        }

        return depList;
    }

    updatePackageVersions(depList) {
        for (let dep of depList) {
            const fetchURL = `https://registry.npmjs.org/${dep}`;
            fetcher(fetchURL).then((data) => {
                const semver_version = global.store.get(LANGUAGE, dep).semver_version;
                if (/^(http[s]*|file):\/\//.test(semver_version)) return; // don't bother checking in this case

                data = JSON.parse(data);
                let latest = null;
                let versions = null;
                if ('dist-tags' in data && 'latest' in data['dist-tags'])
                    latest = data['dist-tags']['latest'];
                if ('versions' in data) versions = Object.keys(data['versions']);
                global.store.set(LANGUAGE, dep, { latest, versions });
            });
        }
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

    async render(handle, dep) {
        const buffer = await handle.nvim.buffer;
        const bufferLines = await buffer.getLines();

        const info = global.store.get(LANGUAGE, dep);

        const lineNumbers = getDepLines(bufferLines, markers, nameRegex, dep);
        for (let ln of lineNumbers) {
            await drawOne(handle, ln, info.current_version, info.latest);
        }
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
