type DirectoryResult = import('tmp-promise').DirectoryResult;

export interface TestEnv {
    tmp: DirectoryResult;
}
