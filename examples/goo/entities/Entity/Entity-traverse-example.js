require([
	'goo/entities/GooRunner'
], function(
	GooRunner
) {
	'use strict';

	var goo = new GooRunner();

	goo.renderer.domElement.id = 'goo';
	document.body.appendChild(goo.renderer.domElement);

	// ---
	var world = goo.world;

	var child11 = world.createEntity('child11').addToWorld();
	var child12 = world.createEntity('child12').addToWorld();

	var parent1 = world.createEntity('parent1').attachChild(child11).attachChild(child12);


	var child21 = world.createEntity('child21').addToWorld();
	var parent2 = world.createEntity('parent2').attachChild(child21);

	console.log('Traversing down from', parent1.name);
	parent1.traverse(function (entity) {
		console.log(entity.name);
	});

	console.log('Traversing down from', parent2.name);
	parent2.traverse(function (entity) {
		console.log(entity.name);
	});
});