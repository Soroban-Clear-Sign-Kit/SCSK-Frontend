import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "adapters/freighter": "src/adapters/freighter.ts",
    "adapters/stellar-wallets-kit": "src/adapters/stellar-wallets-kit.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: '"use client";',
  },
  external: [
    "react",
    "react-dom",
    "@stellar/freighter-api",
    "@creit.tech/stellar-wallets-kit",
  ],
});
