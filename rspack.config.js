const path = require('path');
const {CopyRspackPlugin} = require('@rspack/core');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const output = (directory, library) => ({
    filename: '[name].js',
    chunkFilename: '[name].[contenthash].js',
    path: path.resolve(__dirname, directory),
    ...(library ? {library} : {})
});

const base = {
    mode,
    devtool: 'cheap-module-source-map',
    resolve: {
        fallback: {
            url: require.resolve('url/')
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src'),
                exclude: /node_modules/,
                loader: 'builtin:swc-loader',
                options: {
                    jsc: {
                        parser: {syntax: 'ecmascript'}
                    },
                    env: {
                        targets: ['defaults']
                    }
                },
                type: 'javascript/auto'
            },
            {
                resourceQuery: /bundle-source/,
                loader: path.resolve(__dirname, 'src/extension-support/tw-load-script-as-plain-text.js'),
                type: 'javascript/auto'
            },
            {
                test: /\.mp3$/,
                type: 'asset/resource',
                generator: {
                    filename: 'media/music/[contenthash][ext]'
                }
            }
        ]
    }
};

module.exports = [
    {
        ...base,
        target: 'web',
        entry: {
            'scratch-vm': './src/index.js',
            'scratch-vm.min': './src/index.js'
        },
        output: output('dist/web', {
            name: 'VirtualMachine',
            type: 'umd'
        })
    },
    {
        ...base,
        target: 'node',
        entry: {
            'scratch-vm': './src/index.js'
        },
        output: output('dist/node', {
            name: 'VirtualMachine',
            type: 'commonjs2'
        }),
        externals: {
            'decode-html': 'commonjs decode-html',
            'format-message': 'commonjs format-message',
            'htmlparser2': 'commonjs htmlparser2',
            'scratch-parser': 'commonjs scratch-parser',
            'socket.io-client': 'commonjs socket.io-client'
        }
    },
    {
        ...base,
        target: 'web',
        entry: {
            benchmark: './src/playground/benchmark',
            'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug-entry'
        },
        output: output('playground'),
        performance: {
            hints: false
        },
        plugins: [
            new CopyRspackPlugin({
                patterns: [
                    {from: 'node_modules/scratch-storage/dist/web', to: '.'},
                    {from: 'node_modules/scratch-render/dist/web', to: '.'},
                    {from: 'node_modules/@turbowarp/scratch-svg-renderer/dist/web', to: '.'},
                    {from: 'src/playground', to: '.'}
                ]
            })
        ]
    }
];
