import { defineConfig } from 'vitest/config';

const isCI = Boolean(process.env['CI']);

export default defineConfig({
    server: { watch: { ignored: ['**/.vitest/**'] } },
    test: {
        coverage: {
            enabled: true,
            include: ['src/**/*.ts'],
            exclude: [],
            provider: 'v8',
            reporter: ['text-summary', 'html'],
            reportOnFailure: true,
            reportsDirectory: '.coverage',
            thresholds: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80,
            },
        },
        environment: 'node',
        globals: true,
        include: ['src/**/*.spec.ts'],
        mockReset: true,
        name: 'design-tokens',
        open: false,
        passWithNoTests: true,
        reporters: ['dot', 'html', ...(isCI ? ['github-actions'] : [])],
        setupFiles: ['testing/setup.ts'],
        sequence: {
            shuffle: true,
        },
    },
});
