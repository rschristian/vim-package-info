import { simpleHash, initRenderConfig, getParserConfig } from './utils.js';
import { drawOne } from './render.js';
import { getDepLine } from './render-utils.js';

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

        const lineNumber = getDepLine(packageFileLines, markers, nameRegex, depName);
        if (lineNumber) {
            await drawOne(buffer, renderConfig, lineNumber, { currentVersion: depValue.currentVersion, latestVersion: depValue.latestVersion });
        }
    }

    const parser = getParserConfig(packageFilePath);

    const { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);

    const bufferHash = simpleHash(packageFileContent);
    const lockfileHash = simpleHash(lockFileContent);

    if (
        FILE_CACHE.get(packageFilePath) === bufferHash &&
        FILE_CACHE.get(lockFilePath) === lockfileHash
    ) return;

    // TODO: Branches below this point need a bit more thought, still not 100% sure on them
    if (FILE_CACHE.get(packageFilePath) !== bufferHash) {
        depList = parser.getDepsFromPackageFile(packageFileContent);
        await parser.getRegistryVersions(depList, cb);
    }

    if (FILE_CACHE.get(lockFilePath) !== lockfileHash) {
        await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent, cb);
    }

    FILE_CACHE.set(packageFilePath, bufferHash);
    FILE_CACHE.set(lockFilePath, lockfileHash);
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
