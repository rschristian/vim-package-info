import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import lockfile from '@yarnpkg/lockfile';

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

    updateCurrentVersions(depList, filePath) {
        let found = false;
        let dir = path.resolve(path.dirname(filePath));

        do {
            const npm_lock_filename = path.join(dir, 'package-lock.json');
            const yarn_lock_filename = path.join(dir, 'yarn.lock');
            const pnpm_lock_filename = path.join(dir, 'pnpm-lock.yaml');

            if (fs.existsSync(npm_lock_filename)) {
                found = true;
                const lockfile_content = JSON.parse(fs.readFileSync(npm_lock_filename, 'utf-8'));
                const version = lockfile_content['lockfileVersion'];
                for (let dep of depList) {
                    for (let dg of depGroups) {
                        if (version == 3) {
                            const pkgKey = `node_modules/${dep}`;
                            if (
                                pkgKey in lockfile_content['packages'] && dg == 'dependencies'
                                    ? lockfile_content['packages'][pkgKey]['dev'] === undefined
                                    : lockfile_content['packages'][pkgKey]['dev'] === true
                            ) {
                                global.store.set(LANGUAGE, dep, {
                                    current_version:
                                        lockfile_content['packages'][pkgKey]['version'] || null,
                                });
                                break;
                            }
                        } else if (dg in lockfile_content && dep in lockfile_content[dg]) {
                            global.store.set(LANGUAGE, dep, {
                                current_version: lockfile_content[dg][dep]['version'] || null,
                            });
                            break;
                        }
                    }
                }
            } else if (fs.existsSync(yarn_lock_filename)) {
                found = true;
                const lockfile_content = lockfile.parse(
                    fs.readFileSync(yarn_lock_filename, 'utf-8'),
                );
                for (let dep of depList) {
                    for (let ld of Object.keys(lockfile_content['object'])) {
                        if (ld.split('@')[0] === dep) {
                            const current_version = lockfile_content['object'][ld].version;
                            global.store.set(LANGUAGE, dep, {
                                current_version,
                            });
                        }
                    }
                }
            } else if (fs.existsSync(pnpm_lock_filename)) {
                found = true;
                const lockfile_content = yaml.parse(fs.readFileSync(pnpm_lock_filename, 'utf-8'));
                for (let dep of depList) {
                    for (let dg of depGroups) {
                        if (dg in lockfile_content && dep in lockfile_content[dg]) {
                            let current_version =
                                lockfile_content[dg][dep]['version'].match(/([^\(]+)/);
                            current_version = current_version ? current_version[1] : null;
                            global.store.set(LANGUAGE, dep, {
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

        const info = global.store.get(LANGUAGE, dep);

        const lineNumbers = getDepLines(bufferLines, markers, nameRegex, dep);
        for (let ln of lineNumbers) {
            await drawOne(handle, ln, info.current_version, info.latest);
        }
    }
}
