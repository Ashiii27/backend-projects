/**
 * Side-effect module: importing it installs the global that `types/globals.d.ts`
 * declares. The declaration and the assignment live in different files on
 * purpose — that split is exactly how real `.d.ts` files work.
 */
const info: AppBuildInfo = {
  version: "1.0.0",
  commit: "899e85a",
  builtAt: new Date().toISOString(),
};

(globalThis as unknown as { __BUILD__: AppBuildInfo }).__BUILD__ = info;

(globalThis as unknown as { appVersion: () => string }).appVersion = () =>
  `${info.version} (${info.commit})`;

export {};
