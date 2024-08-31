/** @type {import('jest').Config} */
export default {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*", "!src/index.ts"],
  coverageDirectory: "coverage",
  coverageProvider: "babel",
  moduleNameMapper: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- The key is a module name
    "prosemirror-unified":
      "<rootDir>/node_modules/prosemirror-unified/dist/prosemirror-unified.js",
  },
  resetMocks: true,
  setupFilesAfterEnv: [
    "jest-prosemirror/environment",
    "<rootDir>/__tests__/setupAfterEnv.ts",
  ],
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/__tests__/**/*.test.ts"],
  transform: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- The key is a glob
    "^.+\\.(j|t)s$": [
      "ts-jest",
      {
        tsconfig: "test.tsconfig.json",
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!prosemirror-unified)/"],
};
