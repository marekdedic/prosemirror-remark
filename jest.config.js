/** @type {import('jest').Config} */
export default {
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*", "!src/index.ts"],
  coverageDirectory: "coverage",
  coverageProvider: "babel",
  moduleNameMapper: {
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
    "^.+\\.(j|t)s$": [
      "ts-jest",
      {
        tsconfig: "test.tsconfig.json",
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!prosemirror-unified)/"],
};
