import { describe, it } from 'mocha';
import * as assert from 'node:assert';

import { tests } from './options.js';

import * as utils from '../rplugin/node/vim-package-info/utils.js';

tests.forEach((test) => {
    const fileKind = utils.determineFileKind(test.file);

    describe(test.name, function () {
        describe('utils', function () {
            it('return proper url', function () {
                assert.equal(utils.getUrl(test.tests.url.package, fileKind), test.tests.url.url);
            });
        });
    });
});
