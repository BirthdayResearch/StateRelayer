import path from 'path';
import {Configuration} from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';

const config: Configuration = {
    mode: 'production',
    entry: './index.ts',
    target: 'node',
    module: {
        rules: 
        [
            {
                test: /\.tsx?/,
                use:
                [
                    {
                      loader: 'ts-loader',
                      options: {
                        compilerOptions: {
                            "outDir": "./tsWebpack/"
                        }
                      },
                    },
                ],
                exclude: /node_modules/,
            }
        ]

    },
    resolve: {
        extensions: ['.tsx','.ts','.js']
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'distWebpack'),
        libraryTarget: 'commonjs'
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin(
            {
                terserOptions: {
                    mangle: false
                }
            }
        )]
    },
    externals: {
        'aws-sdk': 'aws-sdk'
    }
} 

export default config;