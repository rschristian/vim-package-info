import { getPackageFile } from './utils.js';

import { Store } from '../../rplugin/node/vim-package-info/store.js';
import * as cargoToml from '../../rplugin/node/vim-package-info/parsers/cargo-toml.js';
import * as pkgJson from '../../rplugin/node/vim-package-info/parsers/package-json.js';
import * as pipfile from '../../rplugin/node/vim-package-info/parsers/pipfile.js';
import * as pyprojectToml from '../../rplugin/node/vim-package-info/parsers/pyproject-toml.js';
import * as requirementsTxt from '../../rplugin/node/vim-package-info/parsers/requirements-txt.js';

const parsers = {
    'javascript:package.json': pkgJson.Parser,
    'python:pipfile': pipfile.Parser,
    'python:pyproject.toml': pyprojectToml.Parser,
    'python:requirements.txt': requirementsTxt.Parser,
    'rust:cargo.toml': cargoToml.Parser,
};

/**
 * @typedef {keyof parsers} ParserKey
 * @typedef {import('../../rplugin/node/vim-package-info/types.d.ts').GenericParser} GenericParser
 */

/**
 * @param {ParserKey} packageFileName
 * @return {Promise<{ store: Store, parser: GenericParser, packageFile: string }>}
 */
export async function setup(packageFileName) {
    const store = new Store(() => {});

    const Parser = parsers[packageFileName];
    const p = new Parser(store);

    const file = await getPackageFile(packageFileName.replace(':', '/'));

    return { store, parser: p, packageFile: file };
}


