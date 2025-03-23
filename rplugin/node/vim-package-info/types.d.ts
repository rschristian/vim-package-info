import { NvimPlugin } from 'neovim';

export interface GenericParser {
    getDeps: (bufferContent: string) => string[];
    updatePackageVersions: (depList: string[]) => void;
    updateCurrentVersions: (depList: string[], filePath: string) => void;
}

export type ParserKey = 'javascript:package.json' | 'python:pipfile' | 'python:pyproject.toml' | 'python:requirements.txt' | 'rust:cargo.toml';

export type ParserConfig = {
    markers: RegExp[][] | null;
    nameRegex: RegExp;
    parser: GenericParser;
}

export type ParsersConfig = Record<ParserKey, ParserConfig>;

export type StoreItem = {
    semverVersion: string;
    currentVersion: string;
    latestVersion: string;
    allVersions: string[];
}

declare global {
    var nvimPlugin: NvimPlugin;
}
