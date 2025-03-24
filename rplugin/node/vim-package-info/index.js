import { simpleHash, initRenderConfig, getParserConfig } from './utils.js';
import { Store } from './store.js';

import { drawOne } from './render.js';
import { getDepLines } from './render-utils.js';

import * as pkgJson from './parsers/package-json.js';

const store = new Store();

const parsersConfig = {
    'javascript:package.json': {
        parser: new pkgJson.PkgJsonParser(store),
    },
    //'python:pipfile': {
    //    parser: pipfile.Parser,
    //},
    //'python:pyproject.toml': {
    //    parser: pyprojectToml.Parser,
    //},
    //'python:requirements.txt': {
    //    parser: requirementsTxt.Parser,
    //},
    //'rust:cargo.toml': {
    //    parser: cargoToml.Parser,
    //},
};

let initialized = false;
const FILE_CACHE = new Map();

/** @type {string[]} */
let depList = [];

let renderConfig = {
    virtualTextNamespace: 0,
    virtualTextPrefix: '',
    virtualTextHlGroup: '',
};

/**
 * @param {import('neovim').NvimPlugin} plugin
 */
async function run(plugin) {
    if (!initialized) {
        const [config, virtualTextNamespace] = await Promise.all([
            initRenderConfig(plugin),
            plugin.nvim.createNamespace('vim-package-info')
        ]);
        renderConfig = { ...config, virtualTextNamespace };

        initialized = true;
    }

    const buffer = await plugin.nvim.buffer;
    const packageFilePath = await buffer.name;
    const packageFileLines = await buffer.lines;
    const packageFileContent = packageFileLines.join('\n');

    /** @type {import('./types.d.ts').RenderCallback} */
    const cb = async (depName, depValue, markers, nameRegex) => {
        if (!depValue.currentVersion || !depValue.latestVersion) return;

        const lineNumbers = getDepLines(packageFileLines, markers, nameRegex, depName);
        for (let ln of lineNumbers) {
            await drawOne(buffer, renderConfig, ln, { currentVersion: depValue.currentVersion, latestVersion: depValue.latestVersion });
        }
    }

    const parser = getParserConfig(packageFilePath);
    //const parser = parsersConfig['javascript:package.json'].parser;

    const { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);

    const bufferHash = simpleHash(packageFileContent);
    const lockfileHash = simpleHash(lockFileContent);

    if (
        FILE_CACHE.get(packageFilePath) === bufferHash &&
        FILE_CACHE.get(lockFilePath) === lockfileHash
    ) return;

    if (FILE_CACHE.get(packageFilePath) !== bufferHash) {
        depList = parser.getDepsFromPackageFile(packageFileContent);
        await parser.getRegistryVersions(depList, cb);
    }

    if (FILE_CACHE.get(lockFilePath) !== lockfileHash) {
        await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent, cb);
    }

    FILE_CACHE.set(packageFilePath, bufferHash);
    FILE_CACHE.set(lockFilePath, lockfileHash);


    //const deps = Object.keys(depMap);
    //const depVersions = Object.values(depMap);

    //// If buffer has changed, but dependencies have not, bail out of any further processing
    //const depHash = simpleHash(deps.join(','));
    //const depVersionsHash = simpleHash(depVersions.join(','));
    //if (DEP_CACHE.get(bufferPath + 'deps') === depHash && DEP_CACHE.get(bufferPath + 'versions') === depVersionsHash) {
    //    //BUFFER_CACHE.set(bufferPath, bufferHash);
    //    return;
    //};

    //// only run if deps themselves have changed -- if only dep versions have changed
    //// no point in fetching data again
    //if (DEP_CACHE.get(bufferPath + 'deps') !== depHash) {
    //    parser.updatePackageVersions(Object.keys(depMap), cb);
    //}

    //BUFFER_CACHE.set(bufferPath, bufferHash);
    //DEP_CACHE.set(bufferPath + 'deps', depHash);
    //DEP_CACHE.set(bufferPath + 'versions', depVersionsHash);
}

/**
 * @param {import('neovim').NvimPlugin} plugin
 */
export default function Plugin(plugin) {
    plugin.setOptions({ dev: true });

    for (const cmd of ['BufEnter', 'InsertLeave', 'TextChanged']) {
        plugin.registerAutocmd(cmd, async () => await run(plugin), {
            pattern: '*/package.json,*/Cargo.toml,*/*requirements.txt,*/Pipfile,*/pyproject.toml',
        });
    }
}
