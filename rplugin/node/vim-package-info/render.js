import { format } from './render-utils.js';

/**
 * @param {import('neovim').NvimPlugin} nvimPlugin
 */
export async function clearAll(nvimPlugin) {
    const buffer = await nvimPlugin.nvim.buffer;
    await buffer.clearNamespace({ nsId: 1 });
}

let initialized = false;
const configValues = {
    prefix: '  ¤ ',
    hlGroup: 'NonText'
};

/**
 * @param {import('neovim').NvimPlugin} nvimPlugin
 * @param {import('neovim').Buffer} buffer
 * @param {number} lineNum
 * @param {string} current
 * @param {string} latest
 */
export async function drawOne(nvimPlugin, buffer, lineNum, current, latest) {
    if (initialized == false) {
        try {
            configValues.prefix = /** @type {string} */ (await nvimPlugin.nvim.eval('g:vim_package_info_virtualtext_prefix'));
        } catch {}
        try {
            configValues.hlGroup = /** @type {string} */ (await nvimPlugin.nvim.eval('g:vim_package_info_virtualtext_highlight'));
        } catch {}

        initialized = true;
    }

    const lp = format(current, configValues.prefix, configValues.hlGroup, latest);

    await buffer.setVirtualText(1, lineNum, lp);
}
