require([
	'goo/entities/GooRunner',
	'goo/entities/World',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Camera',
	'goo/shapes/ShapeCreator',
	'goo/entities/components/CameraComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/entities/EntityUtils',
	'goo/entities/components/ScriptComponent',
	'goo/renderer/MeshData',
	'goo/entities/components/MeshRendererComponent',
	'goo/math/Vector3',
	'goo/renderer/light/PointLight',
	'goo/renderer/light/DirectionalLight',
	'goo/renderer/light/SpotLight',
	'goo/entities/components/LightComponent',
	'goo/addons/howler/components/HowlerComponent',
	'goo/addons/howler/systems/HowlerSystem',
	'goo/renderer/TextureCreator',
	'../../lib/V'
], function (
	GooRunner,
	World,
	Material,
	ShaderLib,
	Camera,
	ShapeCreator,
	CameraComponent,
	OrbitCamControlScript,
	EntityUtils,
	ScriptComponent,
	MeshData,
	MeshRendererComponent,
	Vector3,
	PointLight,
	DirectionalLight,
	SpotLight,
	LightComponent,
	HowlerComponent,
	HowlerSystem,
	TextureCreator,
	V
	) {
	'use strict';

	function howlerComponentDemo(goo) {
		var sound0 = new window.Howl({
			urls: ['../../resources/sfx1.wav']
		}).fadeIn(1);

		var sound1 = new window.Howl({
			urls: ['../../resources/sfx1.wav']
		});

		var sound2 = new window.Howl({
			urls: ['../../resources/sfx2.wav']
		});

		goo.world.setSystem(new HowlerSystem(goo.renderer));

		// create panning cube
		var meshData = ShapeCreator.createBox();
		var material = Material.createMaterial(ShaderLib.texturedLit, 'BoxMaterial');
		var texture = new TextureCreator().loadTexture2D('../../resources/check.png');
		material.setTexture('DIFFUSE_MAP', texture);

		var cubeEntity = EntityUtils.createTypicalEntity(goo.world, meshData, material);
		cubeEntity.addToWorld();

		cubeEntity.setComponent(new ScriptComponent({
			run: function (entity) {
				entity.transformComponent.transform.setRotationXYZ(
					World.time * 1.2,
					World.time * 2.0,
					0);
				entity.transformComponent.transform.translation.setd(
					Math.cos(World.time) * 10,
					0,
					0
				);
				entity.transformComponent.setUpdated();
			}
		}));

		// add howler component to the cube
		var howlerComponent = new HowlerComponent();
		howlerComponent.addSound(sound1);
		cubeEntity.setComponent(howlerComponent);

		// create fixed sphere
		meshData = ShapeCreator.createSphere(32, 32);
		var sphereEntity = EntityUtils.createTypicalEntity(goo.world, meshData, material);
		sphereEntity.transformComponent.transform.translation.setd(0, 0, 5);
		sphereEntity.transformComponent.setUpdated();
		sphereEntity.addToWorld();

		howlerComponent = new HowlerComponent();
		howlerComponent.addSound(sound2);
		sphereEntity.setComponent(howlerComponent);

		// add light
		var light = new PointLight();
		var lightEntity = goo.world.createEntity('light');
		lightEntity.setComponent(new LightComponent(light));
		lightEntity.transformComponent.transform.translation.set(100, 100, 100);
		lightEntity.addToWorld();

		// camera
		V.addOrbitCamera(goo);

		// bind keys
		document.body.addEventListener('keypress', function(e) {
			switch(e.keyCode) {
				case 49:

					cubeEntity.howlerComponent.playSound(0);
					console.log('boing');
					break;
				case 50:
					sphereEntity.howlerComponent.playSound(0);
					console.log('squigly');
					break;
				default:
					console.log('1: sound!');
			}
		});
	}

	function init() {
		var goo = new GooRunner();
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		howlerComponentDemo(goo);
	}

	init();
});