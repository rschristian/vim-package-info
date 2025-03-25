import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { setupTest, teardownTest } from '../lib/lifecycle.js';

import { store } from '../../rplugin/node/vim-package-info/store.js';

test.after.each(() => {
    teardownTest();
});

test('Should return all deps from package file', async () => {
    const { parser, packageFileContent } = await setupTest('python/requirements');

    const depList = parser.getDepsFromPackageFile(packageFileContent);

    assert.equal(depList, [
        'requests',
        'certifi',
        'chardet',
        'falcon',
        'gunicorn',
        'idna',
        'python-mimeparse',
        'requests', // TODO: Duplicated dep entry -- trivial to switch to a `Set`, but should we? Not familiar enough with requirements.txt
        'six',
        'treelib',
        'urllib3',
        'redis'
    ]);

    assert.equal(store.store['python:requirements.txt'], {
        'requests':            { semverVersion: '2.21.0', currentVersion: '2.21.0' },
        'certifi':             { semverVersion: '2018.11.29', currentVersion: '2018.11.29' },
        'chardet':             { semverVersion: '3.0.4', currentVersion: '3.0.4' },
        'falcon':              { semverVersion: '1.4.1', currentVersion: '1.4.1' },
        'gunicorn':            { semverVersion: '19.9.0', currentVersion: '19.9.0' },
        'idna':                { semverVersion: '2.8', currentVersion: '2.8' },
        'python-mimeparse':    { semverVersion: '1.6.0', currentVersion: '1.6.0' },
        'six':                 { semverVersion: '1.12.0', currentVersion: '1.12.0' },
        'treelib':             { semverVersion: '1.5.3', currentVersion: '1.5.3' },
        'urllib3':             { semverVersion: '1.24.1', currentVersion: '1.24.1' },
        'redis':               { semverVersion: '3.0.1', currentVersion: '3.0.1' },
    });
});

test('Should return latest & all versions for all deps from package file', async () => {
    const { parser, packageFileContent } = await setupTest('python/requirements');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    await parser.getRegistryVersions(depList);

    for (const dep of depList) {
        const stored = store.get('python:requirements.txt', dep);
        assert.ok(stored);
        assert.ok(stored.latestVersion);
        assert.ok(stored.allVersions);
    }
});

test.run();
