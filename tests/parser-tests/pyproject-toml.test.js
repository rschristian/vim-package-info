import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { setupTest, teardownTest } from '../lib/lifecycle.js';

import { store } from '../../rplugin/node/vim-package-info/store.js';

test.after.each(() => {
    teardownTest();
});

test('Should return all deps from package file', async () => {
    const { parser, packageFileContent } = await setupTest('python/pyproject');

    const depList = parser.getDepsFromPackageFile(packageFileContent);

    assert.equal(depList, [
        //'python',
        'guessit',
        'tvdb-api',
        'imdbpy',
        'musicbrainzngs',
        'flake8',
    ]);

    assert.equal(store.store['python:pyproject.toml'], {
        //'python':            { semverVersion: '>=2.7, !=3.0.*, !=3.1.*, !=3.2.*, !=3.3.*, !=3.4.*, !=3.5.*, <4' },
        'guessit':           { semverVersion: '>=3.0.0' },
        'tvdb-api':          { semverVersion: '>=2.0' },
        'imdbpy':            { semverVersion: '>=6.6' },
        'musicbrainzngs':    { semverVersion: '>=0.6' },
        'flake8':            { semverVersion: '>=3.5.0' },
    });
});

test('Should return latest & all versions for all deps from package file', async () => {
    const { parser, packageFileContent } = await setupTest('python/pyproject');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    await parser.getRegistryVersions(depList);

    for (const dep of depList) {
        const stored = store.get('python:pyproject.toml', dep);
        assert.ok(stored);
        assert.ok(stored.latestVersion);
        assert.ok(stored.allVersions);
    }
});

test('Should return current versions from package file', async () => {
    const { parser, packageFilePath, packageFileContent } = await setupTest('python/pyproject');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    const { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['python:pyproject.toml'], {
        //'python':            { semverVersion: '>=2.7, !=3.0.*, !=3.1.*, !=3.2.*, !=3.3.*, !=3.4.*, !=3.5.*, <4', currentVersion: '' },
        'guessit':           { semverVersion: '>=3.0.0', currentVersion: '3.0.4' },
        'tvdb-api':          { semverVersion: '>=2.0',   currentVersion: '2.0' },
        'imdbpy':            { semverVersion: '>=6.6',   currentVersion: '6.7' },
        'musicbrainzngs':    { semverVersion: '>=0.6',   currentVersion: '0.6' },
        'flake8':            { semverVersion: '>=3.5.0', currentVersion: '3.7.8' },
    });
});

test.run();
