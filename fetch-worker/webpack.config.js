const path = require('path')
const webpack = require('webpack')
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
module.exports = {
  devtool: 'source-map',
  entry: './index.js',
  target: 'webworker',
  node: {
    fs: 'empty',
    busboy: 'empty',
  },
  resolve: {
    alias: {
      '../cache': path.resolve(
        __dirname,
        '../cacheWorker.js'
      ),
    },
  },
  mode: 'production',
  plugins: [
    new webpack.IgnorePlugin({
      contextRegExp: /node-fetch$/
    }),
    new webpack.DefinePlugin({
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
