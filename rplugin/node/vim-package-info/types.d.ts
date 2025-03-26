import { NvimPlugin } from 'neovim';

export interface PackageFileParser {
    getLockFile(
        packageFilePath: string,
    ): Promise<{ lockFilePath: string; lockFileContent: string }>;

    getDepsFromPackageFile: (bufferContent: string) => string[];

    getRegistryVersions: (depList: string[], cb?: RenderCallback) => Promise<void>;

    getLockFileVersions: (
        depList: string[],
        packageFilePath: string,
        lockFilePath: string,
        lockFileContent: string,
        cb?: RenderCallback,
    ) => Promise<void>;
}

export type ParserKey =
    | 'javascript:package.json'
    | 'python:pipfile'
    | 'python:pyproject.toml'
    | 'python:requirements.txt'
    | 'rust:cargo.toml';

export type StoreItem = {
    semverVersion: string;
    currentVersion: string;
    latestVersion: string;
    allVersions: string[];
};

export type RenderConfig = {
    virtualTextNamespace: number;
    virtualTextPrefix: string;
    virtualTextHlGroup: string;
};

export type RenderCallback = (
    depName: string,
    depValue: Partial<StoreItem>,
    markers: RegExp[][] | null,
    nameRegex: RegExp,
) => Promise<void>;

export type RenderDiff = {
    currentVersion: string;
    latestVersion: string;
};

declare global {
    var plugin: NvimPlugin;
}
