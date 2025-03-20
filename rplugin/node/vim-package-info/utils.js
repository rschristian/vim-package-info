import path from 'node:path';
import followRedirects from 'follow-redirects';

export function determineFileKind(filePath) {
    const filename = path.basename(filePath);

    if (filename.match(/^.*?requirements.txt$/)) {
        return 'python:requirements';
    }
    if (filename.match(/^pyproject.toml$/)) {
        return 'python:pyproject';
    }
    if (filename.match(/^Pipfile/)) {
        return 'python:pipfile';
    }
    if (filename.match(/^Cargo.toml$/)) {
        return 'rust';
    }
    if (filename.match(/^package.json$/)) {
        return 'javascript';
    }
}

// TODO: make use of this
export function getUrl(dep, confType) {
    switch (confType) {
        case 'javascript':
            return `https://registry.npmjs.org/${dep}`;
        case 'rust':
            return `https://crates.io/api/v1/crates/${dep}`;
        case 'python:requirements':
        case 'python:pipfile':
        case 'python:pyproject':
            return `https://pypi.org/pypi/${dep}/json`;
        default:
            return false;
    }
}

// TODO: make this the only way to get this info + do for markers
export function getNameRegex(confType) {
    return {
        javascript: /['|"](.*)['|"] *:/,
        rust: /([a-zA-Z0-9\-_]*) *=.*/,
        'python:requirements': /^ *([a-zA-Z_]+[a-zA-Z0-9\-_]*).*/,
        'python:pipfile': /"?([a-zA-Z0-9\-_]*)"? *=.*/,
        'python:pyproject': /['|"]?([a-zA-Z0-9\-_]*)['|"]? *=.*/,
    }[confType];
}

export function getDepMarkers(confType) {
    // [ [start, end], [start, end] ]
    return {
        javascript: [
            [/["|'](dependencies)["|']/, /\}/],
            [/["|'](devDependencies)["|']/, /\}/],
        ],
        rust: [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]],
        'python:requirements': null,
        'python:pipfile': [
            [/\[(packages)\]/, /^ *\[.*\].*/],
            [/\[(dev-packages)\]/, /^ *\[.*\].*/],
        ],
        'python:pyproject': [[/\[(.*dependencies)\]/, /^ *\[.*\].*/]],
    }[confType];
}

export async function fetcher(url) {
    return new Promise((accept, reject) => {
        const options = {
            headers: {
                'User-Agent': 'vim-package-info (github.com/meain/vim-package-info)',
            },
        };
        if (url)
            followRedirects.https
                .get(url, options, (resp) => {
                    let data = '';
                    resp.on('data', (chunk) => {
                        data += chunk;
                    });
                    resp.on('end', () => {
                        accept(data);
                    });
                })
                .on('error', (err) => {
                    console.log('Error: ' + err.message);
                });
        else {
            console.log('Error: no url provided');
        }
    });
}

export async function getConfigValues(nvim) {
    let prefix = '  ¤ ';
    let hl_group = 'NonText';

    try {
        prefix = await nvim.nvim.eval('g:vim_package_info_virtualtext_prefix');
    } catch (error) {}
    try {
        hl_group = await nvim.nvim.eval('g:vim_package_info_virtualtext_highlight');
    } catch (error) {}

    return { prefix, hl_group };
}

/**
 * @param {string} str
 * @returns {number}
 */
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}
