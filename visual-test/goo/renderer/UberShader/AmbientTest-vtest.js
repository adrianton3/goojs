require([
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/shapes/Box',
	'goo/shapes/Quad',
	'goo/shapes/Sphere',
	'goo/math/Vector3',
	'goo/renderer/MeshData',
	'goo/renderer/TextureCreator',
	'lib/V'
], function (
	Material,
	ShaderLib,
	Box,
	Quad,
	Sphere,
	Vector3,
	MeshData,
	TextureCreator,
	V
	) {
	'use strict';

	V.describe('Three spheres with materialAmbient set on ubershader. The middle sphere has its color continously updated.');

	var goo = V.initGoo();
	var world = goo.world;

	V.addOrbitCamera(new Vector3(8, Math.PI / 2, 0));
	V.addLights();

	var material1 = new Material('Material1', ShaderLib.uber);
	var sphere0 = new Sphere(20, 20);
	world.createEntity(sphere0, material1, [ -1.2, 0, 0]).addToWorld();

	var material2 = new Material('Material1', ShaderLib.uber);
	var sphere1 = new Sphere(20, 20);
	world.createEntity(sphere1, material2, [ 0, 0, 0]).addToWorld();

	var material3 = new Material('Material1', ShaderLib.uber);
	var sphere2 = new Sphere(20, 20);
	world.createEntity(sphere2, material3, [1.2, 0, 0]).addToWorld();

	material1.uniforms.materialAmbient = [1.0, 0.0, 0.0, 1.0];
	material2.uniforms.materialAmbient = [0.0, 1.0, 0.0, 1.0];
	material3.uniforms.materialAmbient = [0.0, 0.0, 1.0, 1.0];

	goo.callbacks.push(function () {
		material2.uniforms.materialAmbient[1] = Math.sin(world.time * 5) * 0.5 + 0.5;
	});

	V.process();
});