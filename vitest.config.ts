import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.test.ts', 'packages/**/__tests__/**/*.test.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@vtn/shared': path.resolve(__dirname, 'packages/shared/src'),
            '@vtn/errors': path.resolve(__dirname, 'packages/errors/src'),
            '@vtn/schemas': path.resolve(__dirname, 'packages/schemas/src'),
            '@vtn/database': path.resolve(__dirname, 'packages/database/src'),
            '@vtn/auth': path.resolve(__dirname, 'packages/auth/src'),
            '@vtn/audit': path.resolve(__dirname, 'packages/audit/src'),
            '@vtn/vietnam': path.resolve(__dirname, 'packages/vietnam/src'),
            '@vtn/logger': path.resolve(__dirname, 'packages/logger/src'),
        },
    },
})
