import { determineFileKind } from './utils.js';
import { Store } from './more.js';
import { clearAll } from './render.js';

import { PackageJson } from './parsers/package-json.js';
import { CargoParser } from './parsers/cargo.js';
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

async function run(handle) {
    globalHandle = handle;
    global.bufferHash = +new Date();
    await clearAll(handle);

    const buffer = await handle.nvim.buffer;
    const bufferLines = await buffer.getLines();
    const bufferContent = bufferLines.join('\n');

    const filePath = await handle.nvim.commandOutput("echo expand('%')"); // there should be a better, I just don't know
    const confType = determineFileKind(filePath);

    const parser = getPackageParser(confType);
    const depList = parser.getDeps(bufferContent);
    parser.updatePackageVersions(depList);
    parser.updateCurrentVersions(depList, filePath);
}

export default function (handle) {
    handle.setOptions({ dev: true });

    ['BufEnter', 'InsertLeave', 'TextChanged'].forEach((e) => {
        handle.registerAutocmd(e, async () => await run(handle), {
            pattern: '*/package.json,*/Cargo.toml,*/*requirements.txt,*/Pipfile,*/pyproject.toml',
        });
    });
}
