import { getConfigValues } from './utils.js';
import { format } from './render-utils.js';

export async function clearAll(handle) {
    await handle.nvim.buffer.clearNamespace({ nsId: 1 });
}

export async function drawOne(handle, lineNum, current, latest) {
    const { prefix, hl_group } = await getConfigValues(handle);
    const lp = format(current, prefix, hl_group, latest);

    const buffer = await handle.nvim.buffer;
    await buffer.setVirtualText(1, lineNum, lp);
}
