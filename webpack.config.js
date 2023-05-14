/* eslint-env node */

module.exports = () => {
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
      filename: "[name].js",
    },
    optimization: {
      minimize: false,
    },
    experiments: {
      outputModule: true,
    },
  };
};
