'use strict';

var HtmlWepbackPlugin = require('html-webpack-plugin');

module.exports = {
  context: '.',
  entry: './src',
  output: {
    path: 'dist',
    filename: '[hash].js',
  },
  devtool: 'source-map',
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
    extension: ['', '.js', '.min.js'],
  },
  plugins: [
    new HtmlWepbackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      inject: 'body',
      templateData: {
        version: require('./package.json').version,
      },
    }),
  ],
};
