const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

let mode = "development";

if (process.env.NODE_ENV === "production") {
  mode = "production";
}

module.exports = {
  mode: mode,

  devtool: "source-map",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
    assetModuleFilename: "images/[hash][ext][query]",
  },

  devServer: {
    static: "./dist",
    devMiddleware: {
      writeToDisk: true,
    },
    hot: true,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.(s[ac]|c)ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "postcss-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)/i,
        type: "asset/resource",
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        type: "asset/resource",
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/i,
        type: "asset/source",
      },
    ],
  },

  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, "./src/static") }],
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
};
