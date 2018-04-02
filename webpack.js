const path=require('path');
const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        vendor: ['react', 'react-dom','material-ui'],
        app: './src/index.js'
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
    },

    resolve: {
        extensions: ['.ts', '.js']
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env','react'],
                        plugins: ["transform-class-properties"]
                    }
                }

            },
            {
                test: /\.css$/,
                use: ['style-loader','css-loader']
            }
        ]
    },
    devServer: {
        contentBase: './dist',
        index: 'index.html',
        hot: true
    },

    plugins: [
        new HtmlWebpackPlugin({
            template:'./src/index.html'
        }),
        new UglifyJSPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],

    optimization: {
        runtimeChunk: {
            name: "app"
        },
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /node_modules/,
                    name: "vendor",
                    chunks: "all"
                }
            }
        }
    }
};