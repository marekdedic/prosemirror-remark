function createConfig(libraryType, extension) {
  return {
    devtool: "source-map",
    entry: {
      "prosemirror-remark": "./src/index.ts",
    },
    experiments: {
      outputModule: true,
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
    mode: "production",
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
    optimization: {
      minimize: false,
    },
    output: {
      filename: `[name].${extension}`,
      library: {
        type: libraryType,
      },
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
  };
}

export default [createConfig("module", "js"), createConfig("commonjs2", "cjs")];
