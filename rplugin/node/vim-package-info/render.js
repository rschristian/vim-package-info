import { format } from './render-utils.js';

/**
 * @param {import('neovim').NvimPlugin} nvimPlugin
 */
export async function clearAll(nvimPlugin) {
    const buffer = await nvimPlugin.nvim.buffer;
    await buffer.clearNamespace({ nsId: 1 });
}

/**
 * @param {import('neovim').NvimPlugin} nvimPlugin
 * @param {number} lineNum
 * @param {string} current
 * @param {string} latest
 */
export async function drawOne(nvimPlugin, lineNum, current, latest) {
    const { prefix, hl_group } = await getConfigValues(nvimPlugin);
    const lp = format(current, prefix, hl_group, latest);

    const buffer = await nvimPlugin.nvim.buffer;
    await buffer.setVirtualText(1, lineNum, lp);
}

/**
 * @param {import('neovim').NvimPlugin} nvimPlugin
 */
async function getConfigValues(nvimPlugin) {
    let prefix = '  ¤ ';
    let hl_group = 'NonText';

    try {
        prefix = await nvimPlugin.nvim.eval('g:vim_package_info_virtualtext_prefix');
    } catch (error) {}
    try {
        hl_group = await nvimPlugin.nvim.eval('g:vim_package_info_virtualtext_highlight');
    } catch (error) {}

    return { prefix, hl_group };
}
