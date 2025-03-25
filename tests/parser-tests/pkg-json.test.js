import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { setupTest, teardownTest } from '../lib/lifecycle.js';

import { store } from '../../rplugin/node/vim-package-info/store.js';

test.after.each(() => {
    teardownTest();
});

test('Should return all deps from package file', async () => {
    const { parser, packageFileContent } = await setupTest('javascript/npm');

    const depList = parser.getDepsFromPackageFile(packageFileContent);

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
    const { parser, packageFileContent } = await setupTest('javascript/npm');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    await parser.getRegistryVersions(depList);

    for (const dep of depList) {
        const stored = store.get('javascript:package.json', dep);
        assert.ok(stored);
        assert.ok(stored.latestVersion);
        assert.ok(stored.allVersions);
    }
});

test('Should return current versions from package-lock.json', async () => {
    const { parser, packageFilePath, packageFileContent } = await setupTest('javascript/npm');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    const { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

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
    const { parser, packageFilePath, packageFileContent } = await setupTest('javascript/yarn');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    const { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

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
    const { parser, packageFilePath, packageFileContent } = await setupTest('javascript/pnpm');

    const depList = parser.getDepsFromPackageFile(packageFileContent);
    const { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

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

test('Should return current versions from monorepo package-lock.json', async () => {
    let { parser, packageFilePath, packageFileContent } = await setupTest('javascript/npm-workspace');

    let depList = parser.getDepsFromPackageFile(packageFileContent);
    let { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' }
    });

    // TODO: Behavior here is correct & mirrors real-world usage, wherein loading the root package.json & then subpackage
    // package.json should result in the store containing deps of both, but it doesn't make for the most clear test case.
    ({ parser, packageFilePath, packageFileContent } = await setupTest('javascript/npm-workspace/packages/package-a'));

    depList = parser.getDepsFromPackageFile(packageFileContent);
    ({ lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath));
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' },

        '@preact/preset-vite':              { semverVersion: '^2.10.1',   currentVersion: '2.10.1' },
        '@rollup/plugin-replace':           { semverVersion: '^5.0.2',    currentVersion: '5.0.7' },
        'html-minifier-terser':             { semverVersion: '^7.2.0',    currentVersion: '7.2.0' },
        'kolorist':                         { semverVersion: '^1.8.0',    currentVersion: '1.8.0' },
        'magic-string':                     { semverVersion: '^0.30.17',  currentVersion: '0.30.17' },
        'node-html-parser':                 { semverVersion: '^6.1.13',   currentVersion: '6.1.13' },
        'preact':                           { semverVersion: '^10.26.4',  currentVersion: '10.26.4' },
        'preact-iso':                       { semverVersion: '^2.9.1',    currentVersion: '2.9.1' },
        'preact-render-to-string':          { semverVersion: '^6.5.13',   currentVersion: '6.5.13' }
    });

    ({ parser, packageFilePath, packageFileContent } = await setupTest('javascript/npm-workspace/packages/package-b'));

    depList = parser.getDepsFromPackageFile(packageFileContent);
    ({ lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath));
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' },

        '@preact/preset-vite':              { semverVersion: '^2.10.1',   currentVersion: '2.10.1' },
        '@rollup/plugin-replace':           { semverVersion: '^5.0.2',    currentVersion: '5.0.7' },
        'html-minifier-terser':             { semverVersion: '^7.2.0',    currentVersion: '7.2.0' },
        'kolorist':                         { semverVersion: '^1.8.0',    currentVersion: '1.8.0' },
        'magic-string':                     { semverVersion: '^0.30.17',  currentVersion: '0.30.17' },
        'node-html-parser':                 { semverVersion: '^6.1.13',   currentVersion: '6.1.13' },
        'preact':                           { semverVersion: '^10.26.4',  currentVersion: '10.26.4' },
        'preact-iso':                       { semverVersion: '^2.9.1',    currentVersion: '2.9.1' },
        'preact-render-to-string':          { semverVersion: '^6.5.13',   currentVersion: '6.5.13' },

        'sade':                             { semverVersion: '^1.8.1',    currentVersion: '1.8.1' },
        'simple-code-frame':                { semverVersion: '^1.3.0',    currentVersion: '1.3.0' },
        'source-map':                       { semverVersion: '^0.7.4',    currentVersion: '0.7.4' },
        'stack-trace':                      { semverVersion: '^1.0.0-pre2', currentVersion: '1.0.0-pre2' },
        'vite':                             { semverVersion: '^5.4.9',    currentVersion: '5.4.14' },
        'rollup':                           { semverVersion: '^4.35.0',   currentVersion: '4.36.0' },
        'rollup-plugin-preserve-shebang':   { semverVersion: '^1.0.1',    currentVersion: '1.0.1' },
        'tmp-promise':                      { semverVersion: '^3.0.3',    currentVersion: '3.0.3' },
        'uvu':                              { semverVersion: '^0.5.6',    currentVersion: '0.5.6' }
    });
});

test('Should return current versions from monorepo yarn.lock', async () => {
    let { parser, packageFilePath, packageFileContent } = await setupTest('javascript/yarn-workspace');

    let depList = parser.getDepsFromPackageFile(packageFileContent);
    let { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' }
    });

    // TODO: Behavior here is correct & mirrors real-world usage, wherein loading the root package.json & then subpackage
    // package.json should result in the store containing deps of both, but it doesn't make for the most clear test case.
    ({ parser, packageFilePath, packageFileContent } = await setupTest('javascript/yarn-workspace/packages/package-a'));

    depList = parser.getDepsFromPackageFile(packageFileContent);
    ({ lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath));
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' },

        '@preact/preset-vite':              { semverVersion: '^2.10.1',   currentVersion: '2.10.1' },
        '@rollup/plugin-replace':           { semverVersion: '^5.0.2',    currentVersion: '5.0.7' },
        'html-minifier-terser':             { semverVersion: '^7.2.0',    currentVersion: '7.2.0' },
        'kolorist':                         { semverVersion: '^1.8.0',    currentVersion: '1.8.0' },
        'magic-string':                     { semverVersion: '^0.30.17',  currentVersion: '0.30.17' },
        'node-html-parser':                 { semverVersion: '^6.1.13',   currentVersion: '6.1.13' },
        'preact':                           { semverVersion: '^10.26.4',  currentVersion: '10.26.4' },
        'preact-iso':                       { semverVersion: '^2.9.1',    currentVersion: '2.9.1' },
        'preact-render-to-string':          { semverVersion: '^6.5.13',   currentVersion: '6.5.13' }
    });

    ({ parser, packageFilePath, packageFileContent } = await setupTest('javascript/yarn-workspace/packages/package-b'));

    depList = parser.getDepsFromPackageFile(packageFileContent);
    ({ lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath));
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' },

        '@preact/preset-vite':              { semverVersion: '^2.10.1',   currentVersion: '2.10.1' },
        '@rollup/plugin-replace':           { semverVersion: '^5.0.2',    currentVersion: '5.0.7' },
        'html-minifier-terser':             { semverVersion: '^7.2.0',    currentVersion: '7.2.0' },
        'kolorist':                         { semverVersion: '^1.8.0',    currentVersion: '1.8.0' },
        'magic-string':                     { semverVersion: '^0.30.17',  currentVersion: '0.30.17' },
        'node-html-parser':                 { semverVersion: '^6.1.13',   currentVersion: '6.1.13' },
        'preact':                           { semverVersion: '^10.26.4',  currentVersion: '10.26.4' },
        'preact-iso':                       { semverVersion: '^2.9.1',    currentVersion: '2.9.1' },
        'preact-render-to-string':          { semverVersion: '^6.5.13',   currentVersion: '6.5.13' },

        'sade':                             { semverVersion: '^1.8.1',    currentVersion: '1.8.1' },
        'simple-code-frame':                { semverVersion: '^1.3.0',    currentVersion: '1.3.0' },
        'source-map':                       { semverVersion: '^0.7.4',    currentVersion: '0.7.4' },
        'stack-trace':                      { semverVersion: '^1.0.0-pre2', currentVersion: '1.0.0-pre2' },
        'vite':                             { semverVersion: '^5.4.9',    currentVersion: '5.4.14' },
        'rollup':                           { semverVersion: '^4.35.0',   currentVersion: '4.36.0' },
        'rollup-plugin-preserve-shebang':   { semverVersion: '^1.0.1',    currentVersion: '1.0.1' },
        'tmp-promise':                      { semverVersion: '^3.0.3',    currentVersion: '3.0.3' },
        'uvu':                              { semverVersion: '^0.5.6',    currentVersion: '0.5.6' }
    });
});

test('Should return current versions from monorepo pnpm-lock.yaml', async () => {
    let { parser, packageFilePath, packageFileContent } = await setupTest('javascript/pnpm-workspace');

    let depList = parser.getDepsFromPackageFile(packageFileContent);
    let { lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath);
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' }
    });

    // TODO: Behavior here is correct & mirrors real-world usage, wherein loading the root package.json & then subpackage
    // package.json should result in the store containing deps of both, but it doesn't make for the most clear test case.
    ({ parser, packageFilePath, packageFileContent } = await setupTest('javascript/pnpm-workspace/packages/package-a'));

    depList = parser.getDepsFromPackageFile(packageFileContent);
    ({ lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath));
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' },

        '@preact/preset-vite':              { semverVersion: '^2.10.1',   currentVersion: '2.10.1' },
        '@rollup/plugin-replace':           { semverVersion: '^5.0.2',    currentVersion: '5.0.7' },
        'html-minifier-terser':             { semverVersion: '^7.2.0',    currentVersion: '7.2.0' },
        'kolorist':                         { semverVersion: '^1.8.0',    currentVersion: '1.8.0' },
        'magic-string':                     { semverVersion: '^0.30.17',  currentVersion: '0.30.17' },
        'node-html-parser':                 { semverVersion: '^6.1.13',   currentVersion: '6.1.13' },
        'preact':                           { semverVersion: '^10.26.4',  currentVersion: '10.26.4' },
        'preact-iso':                       { semverVersion: '^2.9.1',    currentVersion: '2.9.1' },
        'preact-render-to-string':          { semverVersion: '^6.5.13',   currentVersion: '6.5.13' }
    });

    ({ parser, packageFilePath, packageFileContent } = await setupTest('javascript/pnpm-workspace/packages/package-b'));

    depList = parser.getDepsFromPackageFile(packageFileContent);
    ({ lockFilePath, lockFileContent } = await parser.getLockFile(packageFilePath));
    await parser.getLockFileVersions(depList, packageFilePath, lockFilePath, lockFileContent);

    assert.equal(store.store['javascript:package.json'], {
        '@types/node':                      { semverVersion: '^22.13.10', currentVersion: '22.13.11' },
        'prettier':                         { semverVersion: '^2.8.7',    currentVersion: '2.8.8' },
        'prettier-config-rschristian':      { semverVersion: '^0.1.2',    currentVersion: '0.1.2' },

        '@preact/preset-vite':              { semverVersion: '^2.10.1',   currentVersion: '2.10.1' },
        '@rollup/plugin-replace':           { semverVersion: '^5.0.2',    currentVersion: '5.0.7' },
        'html-minifier-terser':             { semverVersion: '^7.2.0',    currentVersion: '7.2.0' },
        'kolorist':                         { semverVersion: '^1.8.0',    currentVersion: '1.8.0' },
        'magic-string':                     { semverVersion: '^0.30.17',  currentVersion: '0.30.17' },
        'node-html-parser':                 { semverVersion: '^6.1.13',   currentVersion: '6.1.13' },
        'preact':                           { semverVersion: '^10.26.4',  currentVersion: '10.26.4' },
        'preact-iso':                       { semverVersion: '^2.9.1',    currentVersion: '2.9.1' },
        'preact-render-to-string':          { semverVersion: '^6.5.13',   currentVersion: '6.5.13' },

        'sade':                             { semverVersion: '^1.8.1',    currentVersion: '1.8.1' },
        'simple-code-frame':                { semverVersion: '^1.3.0',    currentVersion: '1.3.0' },
        'source-map':                       { semverVersion: '^0.7.4',    currentVersion: '0.7.4' },
        'stack-trace':                      { semverVersion: '^1.0.0-pre2', currentVersion: '1.0.0-pre2' },
        'vite':                             { semverVersion: '^5.4.9',    currentVersion: '5.4.14' },
        'rollup':                           { semverVersion: '^4.35.0',   currentVersion: '4.36.0' },
        'rollup-plugin-preserve-shebang':   { semverVersion: '^1.0.1',    currentVersion: '1.0.1' },
        'tmp-promise':                      { semverVersion: '^3.0.3',    currentVersion: '3.0.3' },
        'uvu':                              { semverVersion: '^0.5.6',    currentVersion: '0.5.6' }
    });
});

test.run();
