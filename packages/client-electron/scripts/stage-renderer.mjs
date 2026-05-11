import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const packageRoot = resolve(import.meta.dirname, '..');
const clientWebDistDir = resolve(packageRoot, '../client-web/dist');
const stagedRendererDir = resolve(packageRoot, 'dist/client-web');

await rm(stagedRendererDir, { force: true, recursive: true });
await mkdir(stagedRendererDir, { recursive: true });
await cp(clientWebDistDir, stagedRendererDir, { recursive: true });
