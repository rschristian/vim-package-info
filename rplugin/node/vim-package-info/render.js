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
 */
export async function initConfig(nvimPlugin) {
    if (initialized == false) {
        const virtualTextPrefix = await nvimPlugin.nvim.lua('return vim.g.vim_package_info_virtualtext_prefix');
        if (virtualTextPrefix && typeof virtualTextPrefix === 'string') {
            configValues.prefix = virtualTextPrefix;
        }

        const virtualTextHlGroup = await nvimPlugin.nvim.lua('return vim.g.vim_package_info_virtualtext_highlight');
        if (virtualTextHlGroup && typeof virtualTextHlGroup === 'string') {
            configValues.hlGroup = virtualTextHlGroup;
        }

        initialized = true;
    }
}

/**
 * @param {number} lineNum
 * @param {string} current
 * @param {string} latest
 */
export async function drawOne(lineNum, current, latest) {
    const lp = format(current, configValues.prefix, configValues.hlGroup, latest);

    await globalThis.buffer.setVirtualText(1, lineNum, lp);
}
