export const DEPLOY_BASE_PATH: '/realmfall/';
export const DEPLOY_BRANCH: 'gh-pages';
export const DEPLOY_REMOTE: 'origin';

export interface DeployCliOptions {
  allowDirty: boolean;
  dryRun: boolean;
  help: boolean;
}

export interface PagesPushPlan {
  branchName: string;
  fetchArgs: string[] | null;
  pushArgs: string[];
  remote: string;
}

export function parseCliArgs(argv: string[]): DeployCliOptions;
export function createDeployBuildEnvironment(
  environment?: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv & { REALMFALL_VITE_BASE: string };
export function getViteBasePath(environment?: NodeJS.ProcessEnv): string;
export function getDirtyStatusLines(statusOutput: string): string[];
export function getDeployCommitMessage(sourceCommit: string): string;
export function getDeployWorktreeBranchName(sourceCommit: string): string;
export function createPagesPushPlan(
  hasRemoteTrackingRef: boolean,
  remote?: string,
  branchName?: string,
): PagesPushPlan;
export function ensureNoJekyllFile(publishDirectory: string): Promise<void>;
