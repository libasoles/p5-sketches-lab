const path = require('path');
const webpack = require('webpack')
const fs = require('fs-extra')
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader')
/**
 * Config
 */
const config = {
	server_host: 'localhost',
	server_port: 7800,
	dir_src: './src',
	dir_dist: './build'
}

config.publicPath = 'http://' + config.server_host + ':' + config.server_port + '/build';

/**
 * Init
 */
module.exports = {
    entry: {
        app: [config.dir_src+'/main.ts', config.dir_src+'/styles.scss']
    },
    output: {
        path: path.resolve(config.dir_dist),
        filename: '[name].bundle.js',
        publicPath: config.publicPath
    },
    resolve: {
        extensions: [".js", ".ts"],
				alias: {
					classes: path.resolve(__dirname, './src/app/classes'),
					interfaces: path.resolve(__dirname, './src/app/interfaces'),
					characters: path.resolve(__dirname, './src/app/classes/characters'),
					layout: path.resolve(__dirname, './src/app/classes/layout'),
					views: path.resolve(__dirname, './src/app/classes/views')
				}
    },
		plugins: [
        new webpack.LoaderOptionsPlugin({
            debug: true
        }),
        new HtmlWebpackPlugin({
            template : config.dir_src + '/index.html',
            hash     : false,
            filename : 'index.html',
            inject   : 'body',
            minify   : {
                collapseWhitespace : true
            }
        }),
        new webpack.HotModuleReplacementPlugin(), // Enable HMR
        new ExtractTextPlugin({ // define where to save the file
		      filename: '[name].bundle.css',
		      allChunks: true
		    }),
				new CheckerPlugin()
    ],
    module: {
        rules: [
            {
                test    : /\.(js|jsx)$/,
                exclude : /node_modules/,
                loader  : 'babel-loader',
                query: {
				        	presets: ['es2015', 'stage-2']
				    		}
            },
            {   test: /\.(ts|tsx)$/,
                loader: 'awesome-typescript-loader'
            },
            {
                test   : /\.json$/,
                loader : 'json-loader'
            },
            { // regular css files
				        test: /\.css$/,
				        use: ExtractTextPlugin.extract({
				          use: 'css-loader?importLoaders=1'
				        })
			    	},
						{ // sass / scss loader for webpack
								test: /\.(sass|scss)$/,
								use: ExtractTextPlugin.extract(['css-loader', 'sass-loader'])
						},
						{
						    test: /\.(png|svg|jpg|gif)$/,
						    use: [
						    	'file-loader'
						    ]
						},
						{
						    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
						    loader: 'url-loader',
						    options: {
						        limit: 10000
						    }
						}
        ]
    },
		externals: {
        'p5': 'p5'
    },
		devtool: 'source-map',
		devServer: {
        hot: true, // Tell the dev-server we're using HMR
        contentBase: config.dir_dist,
        publicPath : config.publicPath,
        host: config.server_host,
        port: config.server_port,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        historyApiFallback: true
    }
}
