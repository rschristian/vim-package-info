import { colorizeDiff } from './diff.js';

function isStart(line, depMarkers) {
    // for requirements.txt
    if (depMarkers === null) return { depGroupName: null, end: null };

    for (let i = 0; i < depMarkers.length; i++) {
        const dm = depMarkers[i];
        const depGroup = line.match(dm[0]);
        if (depGroup !== undefined && depGroup !== null) {
            return { depGroupName: depGroup[1], end: dm[1] };
        }
    }
    return false;
}

/**
 * @param {string[]} lines
 * @param {RegExp[][] | null} depMarkers
 * @param {RegExp} nameRegex
 * @param {string} name
 * @param {boolean} [end_maybe_start_of_next=false]
 */
export function getDepLine(lines, depMarkers, nameRegex, name, end_maybe_start_of_next = false) {
    let start = depMarkers === null ? true : false;
    let end = false;
    for (let i = 0; i < lines.length; i++) {
        if (start) {
            if (end && end !== null && end.test(lines[i])) {
                start = false;
                end = false;
                if (end_maybe_start_of_next) --i;
            }

            const vals = lines[i].match(nameRegex);
            if (
                vals !== null &&
                vals !== undefined &&
                1 in vals &&
                vals[1] !== null &&
                vals[1].trim() === name.trim()
            ) {
                return i;
            }
        } else if (!!isStart(lines[i], depMarkers)) {
            start = true;
            end = isStart(lines[i], depMarkers).end;
        }
    }
    return null;
}

/**
 * @param {import('./types.d.ts').RenderConfig} renderConfig
 * @param {string} currentVersion
 * @param {string} latestVersion
 */
export function format(renderConfig, currentVersion, latestVersion) {
    // let lpf = [[`${prefix}No info available`, hl]];
    let lpf = [['', renderConfig.virtualTextHlGroup]];
    const cd = colorizeDiff(currentVersion, latestVersion, renderConfig.virtualTextHlGroup);

    lpf = [[`${renderConfig.virtualTextPrefix} `, renderConfig.virtualTextHlGroup], ...cd];

    return lpf;
}
