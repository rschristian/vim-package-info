import { describe, it } from 'mocha';
import * as assert from 'node:assert';
import * as fs from 'node:fs';

import { PackageJson } from '../rplugin/node/vim-package-info/parsers/package-json.js';

const file = fs.readFileSync('examples/package.json', 'utf-8');
const Parser = PackageJson;

describe('package.json', function () {
    it('returns all deps', function () {
        const p = new Parser();
        const depList = p.getDeps(file);
        assert.deepEqual(depList, [
            'this-package-does-not-exists-sdflkjsd',
            'babel-eslint',
            'react-completor',
            'color-hash',
            'express',
            'preact-compat',
            'react',
            'react-dom',
            'sweetalert2',
            'why-did-you-update',
            'eslint',
            'eslint-config-airbnb',
            'eslint-loader',
            'flow-bin',
        ]);

        p.updateCurrentVersions([depList[0]], 'examples/package.json');
    });
});
