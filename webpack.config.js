/* eslint-env node */

module.exports = () => {
  return {
    mode: "development",
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
    entry: "./src/index.ts",
    output: {
      filename: "[name].js",
    },
    optimization: {
      minimize: false,
      splitChunks: {
        chunks: "all",
      },
    },
  };
};
