'use strict';

var HtmlWepbackPlugin = require('html-webpack-plugin');
var OfflinePlugin = require('offline-plugin');
var UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;

module.exports = {
  context: '.',
  entry: { main: './src/production' },
  output: {
    path: 'dist',
    filename: '[name].js',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /jquery/,
        loader: 'exports-loader?jQuery!script-loader',
      },
      {
        test: /soundjs/,
        loader: 'exports-loader?createjs!script-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'baggage-loader?[file].styl',
      },
      {
        test: /\.styl$/,
        loader: 'style-loader!css-loader!stylus-loader',
      },
      {
        test: /\.(png|wav|mp3|m4a|ogg|opus)$/,
        loader: 'file-loader',
      },
    ],
  },
  resolve: {
    modulesDirectories: ['node_modules', 'vendor'],
    extension: ['', '.min.js', '.js'],
  },
  plugins: [
    new OfflinePlugin({
      caches: {
        main: ['index.html', '*.js'],
      },
      updateStrategy: 'changed',
      scope: '/html-audio-test/',
    }),
    new HtmlWepbackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      inject: 'body',
      templateData: {
        version: require('./package.json').version,
      },
      chunks: ['main'],
    }),
    new UglifyJsPlugin(),
  ],
};
