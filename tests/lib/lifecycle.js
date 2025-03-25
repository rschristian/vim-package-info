import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { store } from '../../rplugin/node/vim-package-info/store.js';
import { getParserConfig } from '../../rplugin/node/vim-package-info/utils.js';

/**
 * @typedef {import('../../rplugin/node/vim-package-info/types.d.ts').PackageFileParser} PackageFileParser
 */

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const packageFileNames = [
    'package.json',
    'Pipfile',
    'pyproject.toml',
    'requirements.txt',
    'Cargo.toml',
];

/**
 * @param {string} name
 * @return {Promise<{ parser: PackageFileParser, packageFilePath: string, packageFileContent: string }>}
 */
export async function setupTest(name) {
    const fixture = path.join(__dirname, '..', 'fixtures', name);

    const fixtureFiles = await fs.readdir(fixture);
    const packageFileName = fixtureFiles.find((file) => packageFileNames.includes(file));
    if (!packageFileName) {
        throw new Error(`No supported package file found in ${fixture}`);
    }

    const parser = getParserConfig(packageFileName);
    const packageFilePath = path.join(fixture, packageFileName);
    const packageFileContent = await fs.readFile(packageFilePath, 'utf-8');

    return { parser, packageFilePath, packageFileContent };
}

/**
 * @returns {void}
 */
export function teardownTest() {
    store.reset();
}
