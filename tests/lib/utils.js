import path from 'node:path';
import url from 'node:url';
import { promises as fs } from 'node:fs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * @param {string} name
 * @return {Promise<string>}
 */
export async function getPackageFile(name) {
    const filePath = path.join(__dirname, '..', 'fixtures', name);
    return await fs.readFile(filePath, 'utf-8')
}

/**
 * @param {string} name
 * @return {string}
 */
export function getFixturePath(name) {
    // Technically a `package.json` doesn't exist there, but our parser takes
    // the current buffer name and gets the parent dir, so this works.
    return path.join(__dirname, '..', 'fixtures', name, 'package.json');
}
