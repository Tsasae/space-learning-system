/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        strict: false,
        skipLibCheck: true,
        module: 'commonjs',
        target: 'ES2020',
        rootDir: '.',
      },
    }],
  },
  setupFiles: ['./tests/setup.ts'],
};
