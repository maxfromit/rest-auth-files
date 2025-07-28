import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    bail: 1,
    testTimeout: 10000,
    watch: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: "istanbul", // or 'v8'
    },
  },
})
