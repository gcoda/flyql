const path = require('path')
const webpack = require('webpack')
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
process.env.FETCHER_URL =
  process.env.FETCHER_URL || 'https://fetcher.nobs.pw'
module.exports = {
  // devtool: 'source-map',
  entry: './apollo-worker.js',
  target: 'webworker',
  node: {
    fs: 'empty',
    busboy: 'empty',
  },
  resolve: {
    alias: {
      './cache': path.resolve(__dirname, './cacheWorker.js'),
      '../../../cache': path.resolve(__dirname, './cacheWorker.js'),
      'apollo-server-cloud-functions': path.resolve(
        __dirname,
        'node_modules',
        'apollo-server-cloudflare'
      ),
      'apollo-server': path.resolve(
        __dirname,
        'node_modules',
        'apollo-server-cloudflare'
      ),
      'apollo-engine-reporting': path.resolve(
        __dirname,
        './null.js'
      ),
      'apollo-engine-reporting-protobuf': path.resolve(
        __dirname,
        './null.js'
      ),
      fs: path.resolve(__dirname, './null.js'),
      busboy: path.resolve(__dirname, './null.js'),
    },
  },
  mode: 'production',
  plugins: [
    new webpack.IgnorePlugin({
      contextRegExp: /node-fetch$/,
    }),
    new webpack.DefinePlugin({
      'process.env.FETCHER_URL': JSON.stringify(
        process.env.FETCHER_URL
      ),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.CF_WEBPACK': JSON.stringify(Date.now()),
    }),
  ],
  optimization: {
    usedExports: true,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'worker.js',
  },
}
