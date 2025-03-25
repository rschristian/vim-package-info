import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { colorizeDiff } from '../rplugin/node/vim-package-info/diff.js';

test('Should return proper diff output for major change', () => {
    assert.equal(colorizeDiff('^1.0.1', '3.4.3', 'NonText'), [
        ['1.0.1', 'NonText'],
        [' ⇒ ', 'NonText'],
        ['3', 'VimPackageInfoMajor'],
        ['.', 'NonText'],
        ['4', 'VimPackageInfoMajor'],
        ['.', 'NonText'],
        ['3', 'VimPackageInfoMajor'],
    ]);
});

test('Should return proper diff output for minor change', () => {
    assert.equal(colorizeDiff('^1.0.1', '1.4.3', 'NonText'), [
        ['1.0.1', 'NonText'],
        [' ⇒ ', 'NonText'],
        ['1', 'NonText'],
        ['.', 'NonText'],
        ['4', 'VimPackageInfoMinor'],
        ['.', 'NonText'],
        ['3', 'VimPackageInfoMinor'],
    ]);
});

test('Should return proper diff output for patch change', () => {
    assert.equal(colorizeDiff('^1.0.1', '1.0.3', 'NonText'), [
        ['1.0.1', 'NonText'],
        [' ⇒ ', 'NonText'],
        ['1', 'NonText'],
        ['.', 'NonText'],
        ['0', 'NonText'],
        ['.', 'NonText'],
        ['3', 'VimPackageInfoPatch'],
    ]);
});

test('Should return proper diff output for no change', () => {
    assert.equal(colorizeDiff('^1.0.1', '1.0.1', 'NonText'), [
        ['1.0.1', 'NonText'],
        [' ⇒ ', 'NonText'],
        ['1', 'NonText'],
        ['.', 'NonText'],
        ['0', 'NonText'],
        ['.', 'NonText'],
        ['1', 'NonText'],
    ]);
});

test('Should return proper diff output without current version', () => {
    assert.equal(colorizeDiff('', '1.0.1', 'NonText'), [
        ['unavailable', 'NonText'],
        [' ⇒ ', 'NonText'],
        ['1', 'NonText'],
        ['.', 'NonText'],
        ['0', 'NonText'],
        ['.', 'NonText'],
        ['1', 'NonText'],
    ]);
});

test('Should return proper diff output with an incomplete current version', () => {
    assert.equal(colorizeDiff('^1.0', '1.0.1', 'NonText'), [
        ['1.0.0', 'NonText'],
        [' ⇒ ', 'NonText'],
        ['1', 'NonText'],
        ['.', 'NonText'],
        ['0', 'NonText'],
        ['.', 'NonText'],
        ['1', 'VimPackageInfoPatch'],
    ]);
});

test.run();
