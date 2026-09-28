import { basename, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { consoleMock } from '../testing/console.ts';
import { fsMock } from '../testing/fs-promises.ts';
import { tokenFiles } from '../testing/token-files.ts';
import { assembleTokens } from './assemble.ts';
import { distDir, tokensDir } from './constants.ts';
import { createCss, createDts, createJs, createScss, createTokensJson } from './outputs.ts';

let runs = 0;

/**
 * The script runs as soon as it is imported, so every test imports it again under a new query string. Its
 * dependencies stay cached, which keeps the shared mocks in place.
 */
async function runScript() {
    await import(/* @vite-ignore */ `./build.ts?run=${++runs}`);
}

/** Serves the token files, and a file that is no token file, from the mocked file system. */
function serveTokenFiles(files: { name: string; content: string }[]) {
    fsMock.respond('readdir', () => ['README.md', ...files.map((file) => file.name)]);
    fsMock.respond('readFile', ({ path }) => files.find((file) => file.name === basename(path))?.content);
}

describe('build', () => {
    beforeEach(() => {
        serveTokenFiles(tokenFiles.map((file) => ({ name: file.name, content: JSON.stringify(file.content) })));
    });

    it('should write every output to a clean dist', async () => {
        await runScript();

        const tokens = assembleTokens(tokenFiles);

        expect(fsMock.entries).toEqual([
            { operation: 'readdir', path: tokensDir },
            ...tokenFiles.map((file) => ({
                operation: 'readFile',
                path: join(tokensDir, file.name),
                options: 'utf-8',
            })),
            { operation: 'rm', path: distDir, options: { recursive: true, force: true } },
            { operation: 'mkdir', path: distDir, options: { recursive: true } },
            { operation: 'writeFile', path: join(distDir, 'tokens.css'), data: createCss(tokens) },
            { operation: 'writeFile', path: join(distDir, 'index.js'), data: createJs(tokens) },
            { operation: 'writeFile', path: join(distDir, 'index.d.ts'), data: createDts(tokens) },
            { operation: 'writeFile', path: join(distDir, 'index.scss'), data: createScss(tokens) },
            {
                operation: 'writeFile',
                path: join(distDir, 'light.tokens.json'),
                data: createTokensJson(tokens, 'light'),
            },
            { operation: 'writeFile', path: join(distDir, 'dark.tokens.json'), data: createTokensJson(tokens, 'dark') },
        ]);
        expect(consoleMock.entriesOf('log').map((entry) => entry.message)).toEqual([
            'Read 4 token files',
            'Assembled 3 tokens',
            'Wrote "tokens.css", "index.js", "index.d.ts", "index.scss", "light.tokens.json", "dark.tokens.json" to "dist"',
        ]);
    });

    it('should fail when the tokens directory has no token files', async () => {
        serveTokenFiles([]);

        await expect(runScript()).rejects.toThrow('No token files found in "tokens"');
        expect(fsMock.entriesOf('writeFile')).toEqual([]);
    });

    it('should fail when a token file is not valid JSON', async () => {
        serveTokenFiles([{ name: 'color.tokens.json', content: '{' }]);

        await expect(runScript()).rejects.toThrow('Failed to parse "color.tokens.json"');
        expect(fsMock.entriesOf('rm')).toEqual([]);
    });
});
