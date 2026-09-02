import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The units under test are plain TypeScript (viem + our own modules);
    // nothing here needs a DOM or the React Native runtime.
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      include: ['src/core/BridgeManager.ts', 'src/hooks/useBridge.ts'],
    },
  },
});
