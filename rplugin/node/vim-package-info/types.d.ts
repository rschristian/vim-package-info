import { NvimPlugin, Buffer } from 'neovim';

export interface GenericParser {
    getLockFile(packageFilePath: string): Promise<{ lockFilePath: string, lockFileContent: string }>;
    getDepsFromPackageFile: (bufferContent: string) => string[];
    getRegistryVersions: (depList: string[], cb?: RenderCallback) => Promise<void>;
    getLockFileVersions: (depList: string[], packageFilePath: string, lockFilePath: string, lockFileContent: string, cb?: RenderCallback) => Promise<void>;
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
    var buffer: Buffer;
}

export type RenderConfig = {
    virtualTextNamespace: number;
    virtualTextPrefix: string;
    virtualTextHlGroup: string;
}

export type RenderCallback = (
    depName: string,
    depValue: Partial<StoreItem>,
    markers: RegExp[][] | null,
    nameRegex: RegExp
) => Promise<void>;

export type RenderDiff = {
    currentVersion: string;
    latestVersion: string;
}
