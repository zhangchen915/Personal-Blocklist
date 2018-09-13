const path=require('path');

module.exports = {
    mode: "production",
    entry: {
        background: './src/content/background.js',
        content_script: './src/content/content_script.js'
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
    },

    resolve: {
        extensions: ['.js']
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env'],
                        plugins: ["transform-runtime"]
                    }
                }

            },
            {
                test: /\.css$/,
                use: ['style-loader','css-loader']
            }
        ]
    },
};