/**
 * Builds the package from the DTCG token files.
 *
 * Reads every token file in `tokens`, resolves the aliases, and writes the outputs to `dist`: the stylesheet, the
 * module and its declarations, and the Sass module. It runs from the `build` script, and `prepare-dist` completes
 * `dist` afterwards.
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { assembleTokens, type TokenFile } from './assemble.ts';
import { distDir, rootDir, TOKEN_FILE_EXTENSION, tokensDir } from './constants.ts';
import { createCss, createDts, createJs, createScss } from './outputs.ts';

async function readTokenFiles(): Promise<TokenFile[]> {
    const names = (await readdir(tokensDir)).filter((name) => name.endsWith(TOKEN_FILE_EXTENSION)).sort();

    if (names.length === 0) {
        throw new Error(`No token files found in "${relative(rootDir, tokensDir)}"`);
    }
    return Promise.all(
        names.map(async (name) => {
            const content = await readFile(join(tokensDir, name), 'utf-8');

            try {
                return { name, content: JSON.parse(content) as unknown };
            } catch (error) {
                throw new Error(`Failed to parse "${name}"`, { cause: error });
            }
        }),
    );
}

async function build(): Promise<void> {
    const files = await readTokenFiles();
    console.log(`Read ${files.length} token files`);

    const tokens = assembleTokens(files);
    console.log(`Assembled ${tokens.length} tokens`);

    const outputs: [string, string][] = [
        ['tokens.css', createCss(tokens)],
        ['index.js', createJs(tokens)],
        ['index.d.ts', createDts(tokens)],
        ['index.scss', createScss(tokens)],
    ];

    await rm(distDir, { recursive: true, force: true });
    await mkdir(distDir, { recursive: true });

    for (const [name, content] of outputs) {
        await writeFile(join(distDir, name), content);
    }
    console.log(`Wrote ${outputs.map(([name]) => `"${name}"`).join(', ')} to "${relative(rootDir, distDir)}"`);
}

await build();
