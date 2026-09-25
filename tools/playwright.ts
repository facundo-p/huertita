/**
 * Playwright para el humo y las capturas. No es dependencia del proyecto (pesa y baja navegadores):
 * se usa el que esté instalado en el proyecto o, si no, el global (`npm i -g playwright`).
 */
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function playwright(): Promise<any> {
  try {
    return await import('playwright' as string);
  } catch {
    const global = join(execSync('npm root -g').toString().trim(), 'playwright', 'index.mjs');
    return import(pathToFileURL(global).href);
  }
}
