import { determineFileKind } from './utils.js';
import { Store } from './store.js';
import { clearAll } from './render.js';

import { PackageJson } from './parsers/package-json.js';
import { CargoParser } from './parsers/cargo-toml.js';
import { RequirementsTxt } from './parsers/requirements-txt.js';
import { PipfileParser } from './parsers/pipfile.js';
import { PyprojectToml } from './parsers/pyproject-toml.js';

let globalHandle = null;
function callRenderer(confType, dep) {
    const parser = getPackageParser(confType);
    if (globalHandle) parser.render(globalHandle, dep);
}

// I think each excecution starts fresh but with same interpretter
if (!('store' in global)) {
    global.store = new Store({}, callRenderer);
    global.bufferHash = null; // use timestamp for now
}

// do not move to utils, will create cyclic dependency
function getPackageParser(confType) {
    switch (confType) {
        case 'rust':
            return new CargoParser();
        case 'javascript':
            return new PackageJson();
        case 'python:requirements':
            return new RequirementsTxt();
        case 'python:pipfile':
            return new PipfileParser();
        case 'python:pyproject':
            return new PyprojectToml();
    }
}

/**
 * @param {import('neovim').NvimPlugin} plugin
 */
async function run(plugin) {
    globalHandle = plugin;
    global.bufferHash = +new Date();
    await clearAll(plugin);

    const buffer = await plugin.nvim.buffer;
    const bufferLines = await buffer.getLines();
    const bufferContent = bufferLines.join('\n');
    const bufferName = await buffer.name;

    const confType = determineFileKind(bufferName);

    const parser = getPackageParser(confType);
    const depList = parser.getDeps(bufferContent);
    parser.updatePackageVersions(depList);
    parser.updateCurrentVersions(depList, bufferName);
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
