import { format } from './render-utils.js';

/**
 * @param {import('neovim').Buffer} buffer
 * @param {number} virtualTextNamespace
 * @return {Promise<void>}
 */
export async function clearAll(buffer, virtualTextNamespace) {
    await buffer.clearNamespace({ nsId: virtualTextNamespace });

}

/**
 * @param {import('neovim').Buffer} buffer
 * @param {import('./types.d.ts').RenderConfig} renderConfig
 * @param {number} lineNum
 * @param {import('./types.d.ts').RenderDiff} depValue
 * @return {Promise<void>}
 */
export async function drawOne(buffer, renderConfig, lineNum, depValue) {
    const lp = format(renderConfig, depValue.currentVersion, depValue.latestVersion);
    await buffer.setVirtualText(renderConfig.virtualTextNamespace, lineNum, lp);
}
