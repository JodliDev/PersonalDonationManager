const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					keep_classnames: true, //we are using "reflection" to find message and page classes
				},
			})
		]
	},
	entry: {
		frontend: path.join(__dirname, '../ts/index.ts')
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"],
	},
	output: {
		// path: "./dist",
		path: path.join(__dirname, '../../../dist/frontend'),
		clean: true,
		// filename: "[name].js",
		// filename: "index.js",
		filename: '[name].[contenthash].js',
		// filename: './frontend.js'
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(__dirname, '../index.html'),
		}),
		new MiniCssExtractPlugin({
			filename: '[name].[contenthash].css',
		})
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: [/node_modules/],
				loader: 'ts-loader'
			},
			{
				test: /\.(png|ico)$/,
				type: "asset/inline",
			},
			{
				test: /\.(css)$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader']
			},
			{
				test: /\.html$/,
				exclude: /main.html/,
				loader: "html-loader"
			},
			{
				test: /\.svg$/,
				oneOf: [
					{ //use an inline svg
						// use: 'raw-loader',
						type: "asset/source"
					}
				],
			},
		]
	}
};
