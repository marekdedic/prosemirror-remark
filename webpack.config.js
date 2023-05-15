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
