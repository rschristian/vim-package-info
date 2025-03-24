import path from 'node:path';

import { Store } from './store.js';
import { drawOne } from './render.js';
import { getDepLines } from './render-utils.js';

import * as cargoToml from './parsers/cargo-toml.js';
import * as pkgJson from './parsers/package-json.js';
import * as pipfile from './parsers/pipfile.js';
import * as pyprojectToml from './parsers/pyproject-toml.js';
import * as requirementsTxt from './parsers/requirements-txt.js';

/**
 * @typedef {import('./types.d.ts').ParserKey} ParserKey
 * @typedef {import('./types.d.ts').GenericParser} GenericParser
 * @typedef {import('./types.d.ts').ParserConfig} ParserConfig
 */

/**
 * @param {string} filePath
 * @return {ParserKey}
 */
function determineFileKind(filePath) {
    const filename = path.basename(filePath);

    if (filename === 'package.json') {
        return 'javascript:package.json';
    }
    if (filename === 'Pipfile') {
        return 'python:pipfile';
    }
    if (filename === 'pyproject.toml') {
        return 'python:pyproject.toml';
    }
    if (filename.match(/^.*?requirements.txt$/)) {
        return 'python:requirements.txt';
    }
    if (filename === 'Cargo.toml') {
        return 'rust:cargo.toml';
    }

    throw new Error(`Unsupported file: ${filePath}`);
}

//const store = new Store(async (lang, dep, depValue) => {
//    if (globalThis.bufferLines) {
//        const { markers, nameRegex } = parsersConfig[lang];
//        const lineNumbers = getDepLines(globalThis.bufferLines, markers, nameRegex, dep);
//        for (let ln of lineNumbers) {
//            await drawOne(ln, depValue.currentVersion, depValue.latest);
//        }
//    }
//});

const parsersConfig = {
    'javascript:package.json': {
        markers: pkgJson.markers,
        nameRegex: pkgJson.nameRegex,
        parser: pkgJson.PkgJsonParser,
    },
    'python:pipfile': {
        markers: pipfile.markers,
        nameRegex: pipfile.nameRegex,
        parser: pipfile.Parser,
    },
    'python:pyproject.toml': {
        markers: pyprojectToml.markers,
        nameRegex: pyprojectToml.nameRegex,
        parser: pyprojectToml.Parser,
    },
    'python:requirements.txt': {
        markers: requirementsTxt.markers,
        nameRegex: requirementsTxt.nameRegex,
        parser: requirementsTxt.Parser,
    },
    'rust:cargo.toml': {
        markers: cargoToml.markers,
        nameRegex: cargoToml.nameRegex,
        parser: cargoToml.Parser,
    },
};

/**
 * @param {string} bufferName
 */
export function getParserConfig(bufferName) {
    //const confType = determineFileKind(bufferName);
    return pkgJson.PkgJsonParser
}

/**
 * @param {string} str
 * @returns {number}
 */
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

/**
 * @param {import('neovim').NvimPlugin} nvimPlugin
 * @return {Promise<{ virtualTextPrefix: string, virtualTextHlGroup: string }>}
 */
export async function initRenderConfig(nvimPlugin) {
    let virtualTextPrefix = '  ¤ ',
        virtualTextHlGroup = 'NonText';

    const globalVirtualTextPrefix = await nvimPlugin.nvim.lua('return vim.g.vim_package_info_virtualtext_prefix');
    if (globalVirtualTextPrefix && typeof globalVirtualTextPrefix === 'string') {
        virtualTextPrefix = globalVirtualTextPrefix;
    }

    const globalVirtualTextHlGroup = await nvimPlugin.nvim.lua('return vim.g.vim_package_info_virtualtext_highlight');
    if (globalVirtualTextHlGroup && typeof globalVirtualTextHlGroup === 'string') {
        virtualTextHlGroup = globalVirtualTextHlGroup;
    }

    return { virtualTextPrefix, virtualTextHlGroup };
}
