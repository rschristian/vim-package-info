import { describe, it } from 'mocha';
import * as assert from 'node:assert';
import { colorizeDiff } from '../rplugin/node/vim-package-info/diff.js';

describe('General checks', function () {
    describe('diff', function () {
        it('return proper diff output for major change', function () {
            assert.deepEqual(colorizeDiff('^1.0.1', '3.4.3', 'NonText'), [
                ['1.0.1', 'NonText'],
                [' ⇒ ', 'NonText'],
                ['3', 'VimPackageInfoMajor'],
                ['.', 'NonText'],
                ['4', 'VimPackageInfoMajor'],
                ['.', 'NonText'],
                ['3', 'VimPackageInfoMajor'],
            ]);
        });
        it('return proper diff output for minor change', function () {
            assert.deepEqual(colorizeDiff('^1.0.1', '1.4.3', 'NonText'), [
                ['1.0.1', 'NonText'],
                [' ⇒ ', 'NonText'],
                ['1', 'NonText'],
                ['.', 'NonText'],
                ['4', 'VimPackageInfoMinor'],
                ['.', 'NonText'],
                ['3', 'VimPackageInfoMinor'],
            ]);
        });
        it('return proper diff output for patch change', function () {
            assert.deepEqual(colorizeDiff('^1.0.1', '1.0.3', 'NonText'), [
                ['1.0.1', 'NonText'],
                [' ⇒ ', 'NonText'],
                ['1', 'NonText'],
                ['.', 'NonText'],
                ['0', 'NonText'],
                ['.', 'NonText'],
                ['3', 'VimPackageInfoPatch'],
            ]);
        });
        it('return proper diff output for no change', function () {
            assert.deepEqual(colorizeDiff('^1.0.1', '1.0.1', 'NonText'), [
                ['1.0.1', 'NonText'],
                [' ⇒ ', 'NonText'],
                ['1', 'NonText'],
                ['.', 'NonText'],
                ['0', 'NonText'],
                ['.', 'NonText'],
                ['1', 'NonText'],
            ]);
        });

        it('return proper diff output without current version', function () {
            assert.deepEqual(colorizeDiff('', '1.0.1', 'NonText'), [
                ['unavailable', 'NonText'],
                [' ⇒ ', 'NonText'],
                ['1', 'NonText'],
                ['.', 'NonText'],
                ['0', 'NonText'],
                ['.', 'NonText'],
                ['1', 'NonText'],
            ]);
        });

        it('return proper diff output with an incomplete current version', function () {
            assert.deepEqual(colorizeDiff('^1.0', '1.0.1', 'NonText'), [
                ['1.0.0', 'NonText'],
                [' ⇒ ', 'NonText'],
                ['1', 'NonText'],
                ['.', 'NonText'],
                ['0', 'NonText'],
                ['.', 'NonText'],
                ['1', 'VimPackageInfoPatch'],
            ]);
        });
    });
});
