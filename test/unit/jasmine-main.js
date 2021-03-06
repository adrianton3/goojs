// Main module for Jasmine HTML test runner
/*global jasmine:true */

'use strict';

require.config({
	paths: {
		'goo': '../../src/goo',
		'test': '../unit',
		'lib': '../lib',
		'goo/lib': '../../lib'
	},
	waitSeconds: 5
});

require(['lib/jasmine-2.3.4/boot'], function () {
	require(['test/CustomMatchers', 'test/all-tests'], function () {
		window.onload();
	});
});