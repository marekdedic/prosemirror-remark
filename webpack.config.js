/* eslint-disable @typescript-eslint/naming-convention -- Not applicable to this config file */

function createConfig(libraryType, extension) {
  return {
    mode: "production",
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.ts$/u,
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
      "remark-parse": "module remark-parse",
      "remark-stringify": "module remark-stringify",
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

export default [createConfig("module", "js"), createConfig("commonjs2", "cjs")];

/* eslint-enable */
