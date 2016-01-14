'use strict';

module.exports = function(grunt) {
  grunt.loadTasks('tasks');

  grunt.registerTask('default', ['webpack-dev-server']);
  grunt.registerTask('build', ['webpack']);
};
