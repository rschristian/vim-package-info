import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { setup } from './lib/lifecycle.js';
import { getFixturePath } from './lib/utils.js';

test('Should return all deps from package file', async () => {
    const { store, parser, packageFile } = await setup('javascript:package.json');

    const depList = parser.getDeps(packageFile);

    assert.equal(depList, [
        '@rschristian/intrepid-design',
        '@rschristian/twind-preact-iso',
        '@sovereignjs/core',
        '@twind/core',
        '@twind/preset-tailwind',
        'module-replacements',
        'preact',
        '@types/semver',
        'prettier',
        'prettier-config-rschristian',
    ]);

    assert.equal(store.store['javascript:package.json'], {
        '@rschristian/intrepid-design':     { semverVersion: '' },
        '@rschristian/twind-preact-iso':    { semverVersion: '^0.4.0' },
        '@sovereignjs/core':                { semverVersion: '^0.1.4' },
        '@twind/core':                      { semverVersion: '^1.1.3' },
        '@twind/preset-tailwind':           { semverVersion: '^1.1.4' },
        'module-replacements':              { semverVersion: '^2.6.0' },
        'preact':                           { semverVersion: '^10.22.0' },
        '@types/semver':                    { semverVersion: '^7.5.4' },
        'prettier':                         { semverVersion: '^2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.1' }
    });
});

test('Should return latest & all versions for all deps from package file', async () => {
    const { store, parser, packageFile } = await setup('javascript:package.json');

    const depList = parser.getDeps(packageFile);
    await parser.updatePackageVersions(depList);

    for (const dep of depList) {
        assert.ok(store.store['javascript:package.json'][dep].latest);
        assert.ok(store.store['javascript:package.json'][dep].versions);
    }
});

test('Should return current versions from package-lock.json', async () => {
    const { store, parser, packageFile } = await setup('javascript:package.json');

    const depList = parser.getDeps(packageFile);
    await parser.updateCurrentVersions(depList, getFixturePath('javascript/npm'));

    assert.equal(store.store['javascript:package.json'], {
        '@rschristian/intrepid-design':     { semverVersion: '',         currentVersion: '0.1.6' },
        '@rschristian/twind-preact-iso':    { semverVersion: '^0.4.0',   currentVersion: '0.4.0' },
        '@sovereignjs/core':                { semverVersion: '^0.1.4',   currentVersion: '0.1.5' },
        '@twind/core':                      { semverVersion: '^1.1.3',   currentVersion: '1.1.3' },
        '@twind/preset-tailwind':           { semverVersion: '^1.1.4',   currentVersion: '1.1.4' },
        'module-replacements':              { semverVersion: '^2.6.0',   currentVersion: '2.6.0' },
        'preact':                           { semverVersion: '^10.22.0', currentVersion: '10.26.4' },
        '@types/semver':                    { semverVersion: '^7.5.4',   currentVersion: '7.5.8' },
        'prettier':                         { semverVersion: '^2.8.8',   currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.1',   currentVersion: '0.1.2' }
    });
});

test('Should return current versions from yarn.lock', async () => {
    const { store, parser, packageFile } = await setup('javascript:package.json');

    const depList = parser.getDeps(packageFile);
    await parser.updateCurrentVersions(depList, getFixturePath('javascript/yarn'));

    assert.equal(store.store['javascript:package.json'], {
        '@rschristian/intrepid-design':     { semverVersion: '',         currentVersion: '0.1.6' },
        '@rschristian/twind-preact-iso':    { semverVersion: '^0.4.0',   currentVersion: '0.4.0' },
        '@sovereignjs/core':                { semverVersion: '^0.1.4',   currentVersion: '0.1.5' },
        '@twind/core':                      { semverVersion: '^1.1.3',   currentVersion: '1.1.3' },
        '@twind/preset-tailwind':           { semverVersion: '^1.1.4',   currentVersion: '1.1.4' },
        'module-replacements':              { semverVersion: '^2.6.0',   currentVersion: '2.6.0' },
        'preact':                           { semverVersion: '^10.22.0', currentVersion: '10.26.4' },
        '@types/semver':                    { semverVersion: '^7.5.4',   currentVersion: '7.5.8' },
        'prettier':                         { semverVersion: '^2.8.8',   currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.1',   currentVersion: '0.1.2' }
    });
});

test('Should return current versions from pnpm-lock.yaml', async () => {
    const { store, parser, packageFile } = await setup('javascript:package.json');

    const depList = parser.getDeps(packageFile);
    await parser.updateCurrentVersions(depList, getFixturePath('javascript/pnpm'));

    assert.equal(store.store['javascript:package.json'], {
        '@rschristian/intrepid-design':     { semverVersion: '',         currentVersion: '0.1.6' },
        '@rschristian/twind-preact-iso':    { semverVersion: '^0.4.0',   currentVersion: '0.4.0' },
        '@sovereignjs/core':                { semverVersion: '^0.1.4',   currentVersion: '0.1.5' },
        '@twind/core':                      { semverVersion: '^1.1.3',   currentVersion: '1.1.3' },
        '@twind/preset-tailwind':           { semverVersion: '^1.1.4',   currentVersion: '1.1.4' },
        'module-replacements':              { semverVersion: '^2.6.0',   currentVersion: '2.6.0' },
        'preact':                           { semverVersion: '^10.22.0', currentVersion: '10.26.4' },
        '@types/semver':                    { semverVersion: '^7.5.4',   currentVersion: '7.5.8' },
        'prettier':                         { semverVersion: '^2.8.8',   currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.1',   currentVersion: '0.1.2' }
    });
});

test.run();
