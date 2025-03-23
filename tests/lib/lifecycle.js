import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { Store } from '../../rplugin/node/vim-package-info/store.js';
import * as cargoToml from '../../rplugin/node/vim-package-info/parsers/cargo-toml.js';
import * as pkgJson from '../../rplugin/node/vim-package-info/parsers/package-json.js';
import * as pipfile from '../../rplugin/node/vim-package-info/parsers/pipfile.js';
import * as pyprojectToml from '../../rplugin/node/vim-package-info/parsers/pyproject-toml.js';
import * as requirementsTxt from '../../rplugin/node/vim-package-info/parsers/requirements-txt.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const parsers = {
    'package.json': pkgJson.Parser,
    'pipfile': pipfile.Parser,
    'pyproject.toml': pyprojectToml.Parser,
    'requirements.txt': requirementsTxt.Parser,
    'cargo.toml': cargoToml.Parser,
};

/**
 * @typedef {import('../../rplugin/node/vim-package-info/types.d.ts').GenericParser} GenericParser
 */

/**
 * @param {string} name
 * @return {Promise<{ store: Store, parser: GenericParser, packageFilePath: string, packageFileContent: string }>}
 */
export async function setup(name) {
    const fixture = path.join(__dirname, '..', 'fixtures', name);

    const fixtureFiles = await fs.readdir(fixture);
    const packageFileName = /** @type {keyof parsers | undefined} */ (fixtureFiles.find(file => Object.keys(parsers).includes(file)));
    if (!packageFileName) {
        throw new Error(`No supported package file found in ${fixture}`);
    }

    const store = new Store(() => {});
    const parser = new parsers[packageFileName](store);
    const packageFilePath = path.join(fixture, packageFileName);
    const packageFileContent = await fs.readFile(packageFilePath, 'utf-8');

    return { store, parser, packageFilePath, packageFileContent};
}


