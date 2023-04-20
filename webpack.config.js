/* eslint-env node */

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { SubresourceIntegrityPlugin } = require("webpack-subresource-integrity");

module.exports = () => {
  return {
    mode: "development",
    devtool: "source-map",
    plugins: [
      new HtmlWebpackPlugin({
        template: "./example/index.html",
      }),
      new MiniCssExtractPlugin(),
      new SubresourceIntegrityPlugin(),
    ],
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
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
    entry: "./example/index.ts",
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
