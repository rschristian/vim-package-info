import { determineFileKind, simpleHash } from './utils.js';
import { Store } from './store.js';
import { clearAll, drawOne } from './render.js';
import { getDepLines } from './render-utils.js';

//import { CargoTomlParser } from './parsers/cargo-toml.js';
import { PackageJsonParser, markers as jsMarkers, nameRegex as jsRegex } from './parsers/package-json.js';
//import { PipfileParser } from './parsers/pipfile.js';
//import { PyprojectTomlParser } from './parsers/pyproject-toml.js';
//import { RequirementsTxtParser } from './parsers/requirements-txt.js';

const CACHE = new Map();

const config = {
    'packageJson': { markers: jsMarkers, nameRegex: jsRegex },
}

/** @type {import('neovim').NvimPlugin | null} */
let globalHandle = null;
const store = new Store(async (lang, dep, depValue) => {
    if (globalHandle != null) {
        const buffer = await globalHandle.nvim.buffer;
        const bufferLines = await buffer.getLines();

        const { markers, nameRegex } = config[lang];
        const lineNumbers = getDepLines(bufferLines, markers, nameRegex, dep);
        for (let ln of lineNumbers) {
            await drawOne(globalHandle, ln, depValue.currentVersion, depValue.latest);
        }
    }
});

// do not move to utils, will create cyclic dependency
function getPackageParser(confType) {
    switch (confType) {
        case 'rust':
            //return new CargoTomlParser();
        case 'javascript':
            return new PackageJsonParser(store);
        case 'python:requirements':
            //return new RequirementsTxtParser();
        case 'python:pipfile':
            //return new PipfileParser();
        case 'python:pyproject':
            //return new PyprojectTomlParser();
    }
}

/**
 * @param {import('neovim').NvimPlugin} plugin
 */
async function run(plugin) {
    globalHandle = plugin;
    await clearAll(plugin);

    const buffer = await plugin.nvim.buffer;
    const bufferLines = await buffer.getLines();
    const bufferContent = bufferLines.join('\n');
    const bufferName = await buffer.name;

    const bufferHash = simpleHash(bufferContent);
    if (CACHE.get(bufferName) === bufferHash) return;

    const confType = determineFileKind(bufferName);

    const parser = getPackageParser(confType);
    const depList = parser.getDeps(bufferContent);

    Promise.allSettled([
        parser.updatePackageVersions(depList),
        parser.updateCurrentVersions(depList, bufferName),
    ]);

    CACHE.set(bufferName, bufferHash);
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
