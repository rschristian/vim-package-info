import { getPackageParser, simpleHash } from './utils.js';
import { clearAll, initConfig } from './render.js';

let initialized = false;
const CACHE = new Map();

/**
 * @param {import('neovim').NvimPlugin} plugin
 */
async function run(plugin) {
    globalThis.nvimPlugin = plugin;
    if (!initialized) {
        await Promise.all([
            clearAll(plugin),
            initConfig(plugin),
        ]);
        initialized = true;
    }

    const buffer = await plugin.nvim.buffer;
    const bufferLines = await buffer.getLines();
    globalThis.buffer = buffer;
    globalThis.bufferLines = bufferLines;
    const bufferContent = bufferLines.join('\n');
    const bufferName = await buffer.name;

    const bufferHash = simpleHash(bufferContent);
    if (CACHE.get(bufferName) === bufferHash) return;

    const parser = getPackageParser(bufferName);
    const depList = parser.getDeps(bufferContent);

    await Promise.allSettled([
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
