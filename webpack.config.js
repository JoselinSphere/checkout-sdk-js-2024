const path = require('path');
const { DefinePlugin } = require('webpack');
const nodeExternals = require('webpack-node-externals');

const {
    babelLoaderRules,
    getBaseConfig,
    libraryEntries,
    libraryName,
} = require('./webpack-common.config');

const outputPath = path.join(__dirname, 'dist');

async function getUmdConfig(options, argv) {
    const baseConfig = await getBaseConfig(options, argv);

    return {
        ...baseConfig,
        name: 'umd',
        entry: libraryEntries,
        output: {
            filename: '[name].umd.js',
            library: libraryName,
            libraryTarget: 'umd',
            path: outputPath,
        },
        module: {
            rules: [...babelLoaderRules, ...baseConfig.module.rules],
        },
    };
}

async function getCjsConfig(options, argv) {
    const baseConfig = await getBaseConfig(options, argv);

    return {
        ...baseConfig,
        name: 'cjs',
        entry: libraryEntries,
        externals: [nodeExternals()],
        output: {
            filename: '[name].js',
            libraryTarget: 'commonjs2',
            path: outputPath,
        },
        plugins: [
            ...baseConfig.plugins,
            new DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            }),
        ],
    };
}

async function getLoaderConfig(options, argv) {
    const baseConfig = await getBaseConfig(options, argv);

    return {
        ...baseConfig,
        name: 'loader',
        entry: {
            'loader': path.join(coreSrcPath, 'bundles', 'loader.ts'), // Entrada específica para loader
        },
        output: {
            filename: 'loader.js',
            library: libraryName,
            libraryTarget: 'umd',
            path: outputPath,
            globalObject: 'this',
        },
        module: {
            rules: [...babelLoaderRules, ...baseConfig.module.rules],
        },
    };
}

async function getConfigs(options, argv) {
    return [await getCjsConfig(options, argv), 
            await getUmdConfig(options, argv),
            await getLoaderConfig(options, argv)];
}

module.exports = getConfigs;
