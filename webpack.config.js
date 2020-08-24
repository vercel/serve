const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: './bin/serve',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'index.js'
	},
	context: __dirname,
	target: 'node',
	node: {
		__filename: false,
		__dirname: false
	},
	externals: ['spawn-sync'],
	module: {
		rules: [
			{
				test: path.resolve(__dirname, 'bin/serve.js'),
				loader: 'string-replace-loader',
				options: { search: '^#!.*[\\r\\n]+', flags: '', replace: '' }
			},
			{
				test: /node_modules.clipboardy\b.*\.js$/,
				loader: 'string-replace-loader',
				options: { search: '\\.\\./(fallbacks/)', flags: 'g', replace: '$1' }
			},
			{
				// transpile ES6-8 into ES5
				test: /\.m?js$/,
				exclude: /node_modules.(ajv|color-convert|cross-spawn|debug|isexe|negotiator|signal-exit|uri-js)\b/,
				loader: 'babel-loader',
				options: {
					cacheDirectory: true,
					presets: [['@babel/preset-env', { targets: { node: '6' } }]] // esmodules
				}
			}
		]
	},
	plugins: [
		new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
		new CopyPlugin([
			{
				from: 'package.json',
				transform(content) {
					return content.toString()
						.replace(/("(d(evD)?ependencies|resolutions|scripts)":\s*\{.*?\}|"files":\s*\[.*?\]),\s*/gs, '')
						.replace(/("serve":\s*")(\.\/)?bin\/serve(\.js")/g, '$1$2index$3');
				}
			},
			'{LICENSE,*.md}',
			{ from: 'node_modules/clipboardy/fallbacks', to: 'fallbacks/', ignore: ['.DS_Store'] },
			{ from: 'node_modules/term-size/vendor', to: 'vendor/' }
		])
	],
	optimization: {
		nodeEnv: false,
		// minimize: false,
		minimizer: [
			new TerserPlugin({
				cache: true,
				parallel: true,
				terserOptions: { mangle: false, output: { beautify: true } },
				extractComments: { condition: /^\**!|@preserve|@license|@cc_on/i, banner: false }
			})
		]
	}
};
