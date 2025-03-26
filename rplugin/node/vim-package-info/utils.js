import path from 'node:path';

import * as cargoToml from './parsers/cargo-toml.js';
import * as pkgJson from './parsers/package-json.js';
import * as pipfile from './parsers/pipfile.js';
import * as pyprojectToml from './parsers/pyproject-toml.js';
import * as requirementsTxt from './parsers/requirements-txt.js';

/**
 * @param {string} filePath
 * @return {import('./types.d.ts').ParserKey}
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

/**
 * @type {Record<import('./types.d.ts').ParserKey, import('./types.d.ts').PackageFileParser>}
 */
const parsersMap = {
    'javascript:package.json': pkgJson.PkgJsonParser,
    'python:pipfile': pipfile.PipfileParser,
    'python:pyproject.toml': pyprojectToml.PyprojectTomlParser,
    'python:requirements.txt': requirementsTxt.RequirementsTxtParser,
    'rust:cargo.toml': cargoToml.CargoTomlParser,
};

/**
 * @param {string} bufferName
 */
export function getParserConfig(bufferName) {
    const confType = determineFileKind(bufferName);
    return parsersMap[confType];
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

    const globalVirtualTextPrefix = await nvimPlugin.nvim.lua(
        'return vim.g.vim_package_info_virtualtext_prefix',
    );
    if (globalVirtualTextPrefix && typeof globalVirtualTextPrefix === 'string') {
        virtualTextPrefix = globalVirtualTextPrefix;
    }

    const globalVirtualTextHlGroup = await nvimPlugin.nvim.lua(
        'return vim.g.vim_package_info_virtualtext_highlight',
    );
    if (globalVirtualTextHlGroup && typeof globalVirtualTextHlGroup === 'string') {
        virtualTextHlGroup = globalVirtualTextHlGroup;
    }

    return { virtualTextPrefix, virtualTextHlGroup };
}

/**
 * @param {'error' | 'warn' | 'info' | 'debug'} level
 * @param {string} message
 */
export function logger(level, message) {
    globalThis.plugin.nvim.logger[level](`vim-package-info: ${message}`);
}

/**
 * @param {string} message
 */
export function errWriteLine(message) {
    globalThis.plugin.nvim.errWriteLine(`vim-package-info: ${message}`);
}
