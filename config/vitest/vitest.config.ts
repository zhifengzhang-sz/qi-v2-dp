import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vitest/config";

const rootDir = resolve(__dirname, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  return {
    resolve: {
      alias: {
        "@qi/core": resolve(rootDir, "lib/src/index.ts"),
        "@qi/core/base": resolve(rootDir, "lib/src/qicore/base/index.ts"),
        "@qi/dp/domain": resolve(rootDir, "lib/src/domain/index.ts"),
        "@qi/dp/market/crypto/sources": resolve(
          rootDir,
          "lib/src/market/crypto/actors/sources/index.ts",
        ),
        "@qi/dp/market/crypto/targets": resolve(
          rootDir,
          "lib/src/market/crypto/actors/targets/index.ts",
        ),
        "@qi/dp/utils": resolve(rootDir, "lib/src/utils/index.ts"),
      },
    },
    test: {
      environment: "node",
      globals: true,
      include: [
        resolve(rootDir, "lib/tests/**/*.test.ts"),
        resolve(rootDir, "app/tests/**/*.test.ts"),
        resolve(rootDir, "tests/**/*.test.ts"),
      ],
      exclude: [resolve(rootDir, "node_modules/**"), resolve(rootDir, "dist/**")],
      isolate: true,
      pool: "forks",
      env: {
        ...env,
      },
    },
  };
});
