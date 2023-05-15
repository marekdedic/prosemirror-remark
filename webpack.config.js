/* eslint-env node */

function createConfig(libraryType, extension) {
  return {
    mode: "production",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: "ts-loader",
            options: {
              onlyCompileBundledFiles: true,
            },
          },
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    entry: {
      "prosemirror-remark": "./src/index.ts",
    },
    output: {
      filename: "[name]." + extension,
      library: {
        type: libraryType,
      },
    },
    externals: {
      "prosemirror-commands": "module prosemirror-commands",
      "prosemirror-inputrules": "module prosemirror-inputrules",
      "prosemirror-model": "module prosemirror-model",
      "prosemirror-schema-list": "module prosemirror-schema-list",
      "prosemirror-state": "module prosemirror-state",
      "prosemirror-unified": "module prosemirror-unified",
      "prosemirror-view": "module prosemirror-view",
      "remark-parse": "module remark-parse",
      "remark-stringify": "module remark-stringify",
      "remark-unwrap-images": "module remark-unwrap-images",
      unified: "module unified",
    },
    optimization: {
      minimize: false,
    },
    experiments: {
      outputModule: true,
    },
  };
}

module.exports = [
  createConfig("module", "js"),
  createConfig("commonjs2", "cjs"),
];
