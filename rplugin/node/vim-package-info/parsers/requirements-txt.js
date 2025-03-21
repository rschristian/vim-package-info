const LANGUAGE = 'python:requirements.txt';
export const markers = null;
export const nameRegex = /^ *([a-zA-Z_]+[a-zA-Z0-9\-_]*).*/;

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
        const depList = [];

        for (let line of bufferContent.split('\n')) {
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

                this.store.set(LANGUAGE, dep, {
                    semverVersion,
                    currentVersion: semverVersion,
                });
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
        // no specific lockfile, copy semver_version to current_version
        // taken care in getDeps
    }
}
