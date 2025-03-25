import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { setupTest, teardownTest } from '../lib/lifecycle.js';

import { store } from '../../rplugin/node/vim-package-info/store.js';

test.after.each(() => {
    teardownTest();
});

test('Should return all deps from package file', async () => {
    const { parser, packageFileContent } = await setupTest('rust');

    const depList = parser.getDepsFromPackageFile(packageFileContent);

    assert.equal(depList, [
        'tar',
        'ansi_term',
        'libc',
        'serde',
        'users',
        'lscolors',
        'clap',
        'clap', // TODO: It looks like `[dependencies.*]` results in duplicated dep entry -- trivial to switch to a `Set`, but should we?
        'version_check',
        'tempdir',
    ]);

    assert.equal(store.store['rust:cargo.toml'], {
        'tar':              { semverVersion: '0.4.5' },
        'ansi_term':        { semverVersion: '0.11.0' },
        'libc':             { semverVersion: '0.2.44' },
        'serde':            { semverVersion: '~1.0' },
        'users':            { semverVersion: '0.8.0' },
        'lscolors':         { semverVersion: '0.5.0' },
        'clap':             { semverVersion: '2.32.0' },
        'version_check':    { semverVersion: '0.1.3' },
        'tempdir':          { semverVersion: '0.3.7' },
    });
});

test('Should return latest & all versions for all deps from package file', async () => {
    const { parser, packageFileContent } = await setupTest('rust');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    await parser.getRegistryVersions(depList);

    for (const dep of depList) {
        const stored = store.get('rust:cargo.toml', dep);
        assert.ok(stored);
        assert.ok(stored.latestVersion);
        assert.ok(stored.allVersions);
    }
});

test('Should return current versions from package file', async () => {
    const { parser, packageFilePath, packageFileContent } = await setupTest('rust');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    const { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['rust:cargo.toml'], {
        'tar':              { semverVersion: '0.4.5',  currentVersion: '0.4.26' },
        'ansi_term':        { semverVersion: '0.11.0', currentVersion: '0.11.0' },
        'libc':             { semverVersion: '0.2.44', currentVersion: '0.2.59' },
        'serde':            { semverVersion: '~1.0',   currentVersion: '1.0.94' },
        'users':            { semverVersion: '0.8.0',  currentVersion: '0.8.1' },
        'lscolors':         { semverVersion: '0.5.0',  currentVersion: '0.5.0' },
        'clap':             { semverVersion: '2.32.0', currentVersion: '2.33.0' },
        'version_check':    { semverVersion: '0.1.3',  currentVersion: '0.1.5' },
        'tempdir':          { semverVersion: '0.3.7',  currentVersion: '0.3.7' },
    });
});

test.run();
