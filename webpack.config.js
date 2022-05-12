const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const htmlTemplate = require('html-webpack-template')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const webpack = require('webpack')
const { SENTRY_RELEASE, NODE_ENV } = process.env
const sentryRelease = !SENTRY_RELEASE ? 'unknown' : SENTRY_RELEASE

// eslint-disable-next-line
console.log('sentry settings:', { sentryRelease }, 'env', NODE_ENV)

// eslint-disable-next-line
module.exports = (env, argv) => {
  const additionalPlugins =
    NODE_ENV === 'production' || NODE_ENV === 'staging'
      ? [] // Make JS smaller
      : [new webpack.HotModuleReplacementPlugin()] // Enable hot module replacement

  const additionalOptimizations =
    NODE_ENV === 'production' || NODE_ENV === 'staging'
      ? {
          minimizer: [
            // Make CSS smaller
            new OptimizeCssAssetsPlugin()
          ]
        }
      : {}

  const additionalEntries =
    NODE_ENV === 'production' || NODE_ENV === 'staging' ? [] : ['webpack-hot-middleware/client?http://localhost:8000']

  const BASE_PATH = process.env.BASE_PATH || '/'

  return {
    mode:
      NODE_ENV === 'production' || NODE_ENV === 'staging' // Webpack mode must be prod, dev or none
        ? 'production'
        : 'development',
    output: {
      publicPath: BASE_PATH
    },
    devtool: 'source-map',
    entry: [
      '@babel/polyfill', // so we don't need to import it anywhere
      './client',
      ...additionalEntries
    ],
    resolve: {
      alias: {
        Utilities: path.resolve(__dirname, 'client/utils/'),
        Components: path.resolve(__dirname, 'client/components/'),
        Assets: path.resolve(__dirname, 'client/assets/'),
        Root: path.resolve(__dirname)
      }
    },
    module: {
      rules: [
        {
          // Load JS files
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          // Load CSS files
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader']
        },
        {
          // Load other files
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
          use: ['file-loader']
        }
      ]
    },
    optimization: {
      ...additionalOptimizations
    },
    plugins: [
      // Skip the part where we would make a html template
      new HtmlWebpackPlugin({
        title: 'Suotar by Toska',
        favicon: path.resolve(__dirname, 'client/assets/favicon-32x32.png'),
        inject: false,
        template: htmlTemplate,
        appMountId: 'root',
        headHtmlSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
      }),
      // Extract css
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[name]-[id].css'
      }),
      new webpack.DefinePlugin({
        __BASE_PATH__: JSON.stringify(BASE_PATH),
        'process.env': {
          NODE_ENV: JSON.stringify(NODE_ENV),
          SENTRY_RELEASE: JSON.stringify(sentryRelease),
          BUILT_AT: JSON.stringify(new Date().toISOString())
        }
      }),
      ...additionalPlugins
    ]
  }
}
