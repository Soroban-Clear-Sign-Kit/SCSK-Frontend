import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const testDir = path.resolve(rootDir, ".tmp-vite-test");
const backendDir = path.resolve(rootDir, "../SCSK-Backend");

console.log("=== 1. Preparing clean test workspace ===");
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log("=== 2. Packing tarballs ===");
// Pack @clearsign/core if backend exists, or construct a mock package for isolated CI environments
let coreTarballPath = null;
if (fs.existsSync(backendDir)) {
  execSync(`pnpm --dir "${backendDir}" pack --pack-destination "${testDir}"`, {
    encoding: "utf-8",
  });
  const coreFile = fs
    .readdirSync(testDir)
    .find((f) => f.startsWith("clearsign-core") && f.endsWith(".tgz"));
  if (coreFile) {
    coreTarballPath = path.resolve(testDir, coreFile);
    console.log(`Packed @clearsign/core: ${coreTarballPath}`);
  }
} else {
  console.log(
    "Backend directory not present (CI runner environment); generating stub @clearsign/core package for tarball test...",
  );
  const stubCoreDir = path.join(testDir, ".stub-core");
  fs.mkdirSync(stubCoreDir, { recursive: true });
  fs.writeFileSync(
    path.join(stubCoreDir, "package.json"),
    JSON.stringify(
      {
        name: "@clearsign/core",
        version: "0.1.0",
        type: "module",
        main: "./index.js",
        types: "./index.d.ts",
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(stubCoreDir, "index.js"),
    "export function buildPreview() { return {}; }\nexport class ClearSignPreview {}\n",
  );
  fs.writeFileSync(
    path.join(stubCoreDir, "index.d.ts"),
    "export declare function buildPreview(...args: any[]): any;\nexport interface ClearSignPreview { [key: string]: any; }\n",
  );
  execSync(`pnpm pack --pack-destination "${testDir}"`, {
    cwd: stubCoreDir,
    encoding: "utf-8",
  });
  fs.rmSync(stubCoreDir, { recursive: true, force: true });
  const coreFile = fs
    .readdirSync(testDir)
    .find((f) => f.startsWith("clearsign-core") && f.endsWith(".tgz"));
  if (coreFile) {
    coreTarballPath = path.resolve(testDir, coreFile);
    console.log(`Packed stub @clearsign/core: ${coreTarballPath}`);
  }
}

// Pack @clearsign/react
execSync(`pnpm pack --pack-destination "${testDir}"`, {
  cwd: rootDir,
  encoding: "utf-8",
});
const reactFile = fs
  .readdirSync(testDir)
  .find((f) => f.startsWith("clearsign-react") && f.endsWith(".tgz"));
if (!reactFile) {
  throw new Error("Failed to pack @clearsign/react tarball");
}
const reactTarballPath = path.resolve(testDir, reactFile);
console.log(`Packed @clearsign/react: ${reactTarballPath}`);

console.log("=== 3. Setting up clean Vite application ===");
const packageJson = {
  name: "clean-vite-consumer",
  private: true,
  type: "module",
  scripts: {
    build: "vite build",
  },
  dependencies: {
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    "@clearsign/react": `file:${reactTarballPath}`,
    ...(coreTarballPath
      ? { "@clearsign/core": `file:${coreTarballPath}` }
      : {}),
  },
  devDependencies: {
    vite: "^5.4.11",
    "@vitejs/plugin-react": "^4.3.4",
  },
};

fs.writeFileSync(
  path.join(testDir, "package.json"),
  JSON.stringify(packageJson, null, 2),
);

// In pnpm v10+, overrides must be declared in pnpm-workspace.yaml
const pnpmWorkspaceYaml = `packages:
  - "."
${
  coreTarballPath
    ? `overrides:
  "@clearsign/core": "${coreTarballPath.replace(/\\/g, "/")}"`
    : ""
}
onlyBuiltDependencies:
  - esbuild
`;
fs.writeFileSync(path.join(testDir, "pnpm-workspace.yaml"), pnpmWorkspaceYaml);

// Create vite.config.ts
const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;
fs.writeFileSync(path.join(testDir, "vite.config.ts"), viteConfig);

// Create index.html
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Clean Vite Tarball Consumer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
fs.writeFileSync(path.join(testDir, "index.html"), indexHtml);

// Create src/main.tsx
fs.mkdirSync(path.join(testDir, "src"), { recursive: true });
const mainTsx = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClearSignModal } from '@clearsign/react';
import '@clearsign/react/styles.css';

export function App() {
  return (
    <div id="test-container">
      <ClearSignModal
        preview={{
          version: 1,
          risk: 'ok',
          warnings: [],
          network: {
            passphrase: 'Test SDF Network ; September 2015',
            rpcMatches: true,
            signatureBound: true,
          },
          authorizations: [],
        }}
        loading={false}
        onApprove={() => console.log('approved')}
        onReject={() => console.log('rejected')}
      />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
`;
fs.writeFileSync(path.join(testDir, "src", "main.tsx"), mainTsx);

// Create src/render-check.mjs to verify rendering the modal from the installed tarball
const renderCheckMjs = `
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ClearSignModal } from '@clearsign/react';

const html = renderToString(
  React.createElement(ClearSignModal, {
    preview: {
      version: 1,
      risk: 'ok',
      warnings: [],
      network: {
        passphrase: 'Test SDF Network ; September 2015',
        rpcMatches: true,
        signatureBound: true,
      },
      authorizations: [],
    },
    loading: false,
    onApprove: () => {},
    onReject: () => {},
  })
);

if (!html.includes('role="dialog"') && !html.includes('clearsign')) {
  throw new Error('Rendered HTML did not contain expected modal elements: ' + html);
}
console.log('Successfully rendered modal from installed tarball! HTML output length: ' + html.length);
`;
fs.writeFileSync(path.join(testDir, "src", "render-check.mjs"), renderCheckMjs);

console.log("=== 4. Installing packed dependencies in clean Vite app ===");
execSync("pnpm install --no-frozen-lockfile --ignore-scripts", {
  cwd: testDir,
  stdio: "inherit",
});

console.log("=== 4b. Rendering modal from installed tarball ===");
execSync("node src/render-check.mjs", {
  cwd: testDir,
  stdio: "inherit",
});

console.log("=== 5. Building clean Vite application with Vite ===");
execSync("npx vite build", {
  cwd: testDir,
  stdio: "inherit",
});

console.log("=== 6. Verifying compiled bundle and modal styles ===");
const distDir = path.join(testDir, "dist");
if (!fs.existsSync(distDir)) {
  throw new Error("Vite dist directory was not generated!");
}

const distAssets = fs.readdirSync(path.join(distDir, "assets"));
console.log("Vite output assets:", distAssets);

const cssFile = distAssets.find((f) => f.endsWith(".css"));
const jsFile = distAssets.find((f) => f.endsWith(".js"));

if (!cssFile || !jsFile) {
  throw new Error("Missing CSS or JS output assets in clean Vite build");
}

const cssContent = fs.readFileSync(
  path.join(distDir, "assets", cssFile),
  "utf-8",
);
const jsContent = fs.readFileSync(
  path.join(distDir, "assets", jsFile),
  "utf-8",
);

console.log(`Vite bundle JS size: ${(jsContent.length / 1024).toFixed(2)} KB`);
console.log(
  `Vite bundle CSS size: ${(cssContent.length / 1024).toFixed(2)} KB`,
);

// Ensure ClearSign dialog and modal styles are bundled
if (
  !cssContent.includes("--clearsign-") &&
  !cssContent.includes("dialog") &&
  !cssContent.includes("clearsign")
) {
  throw new Error("Expected ClearSign styles to be bundled in Vite output");
}

console.log("=== 7. Cleaning up temporary workspace ===");
fs.rmSync(testDir, { recursive: true, force: true });

console.log(
  "\n✅ SUCCESS: Packed tarball successfully installed into clean Vite app, compiled, and verified!",
);
