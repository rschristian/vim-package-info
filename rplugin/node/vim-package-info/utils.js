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

const store = new Store(async (lang, dep, depValue) => {
    if (globalThis.nvimPlugin) {
        const buffer = await globalThis.nvimPlugin.nvim.buffer;
        const bufferLines = await buffer.getLines();

        const { markers, nameRegex } = parsersConfig[lang];
        const lineNumbers = getDepLines(bufferLines, markers, nameRegex, dep);
        for (let ln of lineNumbers) {
            await drawOne(buffer, ln, depValue.currentVersion, depValue.latest);
        }
    }
});

/**
 * @type {import('./types.d.ts').ParsersConfig}
 */
const parsersConfig = {
    'javascript:package.json': {
        markers: pkgJson.markers,
        nameRegex: pkgJson.nameRegex,
        parser: new pkgJson.Parser(store),
    },
    'python:pipfile': {
        markers: pipfile.markers,
        nameRegex: pipfile.nameRegex,
        parser: new pipfile.Parser(store),
    },
    'python:pyproject.toml': {
        markers: pyprojectToml.markers,
        nameRegex: pyprojectToml.nameRegex,
        parser: new pyprojectToml.Parser(store),
    },
    'python:requirements.txt': {
        markers: requirementsTxt.markers,
        nameRegex: requirementsTxt.nameRegex,
        parser: new requirementsTxt.Parser(store),
    },
    'rust:cargo.toml': {
        markers: cargoToml.markers,
        nameRegex: cargoToml.nameRegex,
        parser: new cargoToml.Parser(store),
    },
};

/**
 * @param {string} bufferName
 * @return {GenericParser}
 */
export function getPackageParser(bufferName) {
    const confType = determineFileKind(bufferName);
    return parsersConfig[confType].parser;
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
