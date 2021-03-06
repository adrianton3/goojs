require([
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/math/Vector3',
	'goo/geometrypack/PolyLine',
	'lib/V'
], function (
	Material,
	ShaderLib,
	Vector3,
	PolyLine,
	V
	) {
	'use strict';

	V.describe('A rotational surface generated by spinning a polyLine around the Y axis');

	var goo = V.initGoo();
	var world = goo.world;

	var section = PolyLine.fromCubicSpline([
			3 + 0, -1, 0,
			3 + 1,  0, 0,
			3 + 1,  1, 0,
			3 + 0,  1, 0,
			3 - 1,  1, 0,
			3 - 1,  2, 0,
			3 + 0,  3, 0
		], 20);

	var latheMeshData = section.lathe(20);

	var material = new Material(ShaderLib.simpleLit);
	world.createEntity(latheMeshData, material).addToWorld();

	var normalsMeshData = latheMeshData.getNormalsMeshData(4);
	var normalsMaterial = new Material(ShaderLib.simpleColored);
	normalsMaterial.uniforms.color = [0.2, 1.0, 0.6];
	world.createEntity(normalsMeshData, normalsMaterial).addToWorld();

	V.addLights();

	V.addOrbitCamera(new Vector3(10, Math.PI / 2, 0));

	V.process();
});
