define([
	'goo/entities/World',
	'goo/entities/Entity',
	'goo/entities/components/CameraComponent',
	'goo/renderer/Camera',
	'goo/entities/SystemBus',
	'test/CustomMatchers'
], function (
	World,
	Entity,
	CameraComponent,
	Camera,
	SystemBus,
	CustomMatchers
	) {
	'use strict';

	describe('CameraComponent', function () {
		var world;

		beforeEach(function () {
			world = new World();
			world.registerComponent(CameraComponent);
			jasmine.addMatchers(CustomMatchers);
		});

		it('attaches .setAsMainCamera to the host entity', function () {
			var camera = new Camera();
			var cameraComponent = new CameraComponent(camera);
			var entity = new Entity(world);

			entity.setComponent(cameraComponent);
			expect(entity.setAsMainCamera).toBeDefined();
		});

		describe('.setAsMainCamera', function () {
			it('sets the main camera', function () {
				var camera = new Camera();
				var cameraComponent = new CameraComponent(camera);
				var entity = new Entity(world);

				entity.setComponent(cameraComponent);

				var listener = jasmine.createSpy('camera-listener');
				SystemBus.addListener('goo.setCurrentCamera', listener);
				entity.setAsMainCamera();
				expect(listener).toHaveBeenCalledWith({
						camera: camera,
						entity: entity
					},
					'goo.setCurrentCamera',
					SystemBus
				);
			});

			it('returns the calling entity', function () {
				var cameraComponent = new CameraComponent(new Camera());
				var entity = new Entity(world);

				entity.setComponent(cameraComponent);
				expect(entity.setAsMainCamera()).toBe(entity);
			});
		});

		describe('copy', function () {
			it('can copy everything from another camera component', function () {
				var original = new CameraComponent(new Camera(50, 2, 2, 2000));
				var copy = new CameraComponent(new Camera(50, 2, 2, 2000));
				copy.copy(original);

				expect(copy).toBeCloned(original);
			});
		});

		describe('clone', function () {
			it('can clone a camera component', function () {
				var original = new CameraComponent(new Camera(50, 2, 2, 2000));
				var clone = original.clone();

				expect(clone).toBeCloned(original);
			});
		});
	});
});
