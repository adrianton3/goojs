define([
	'goo/entities/World',
	'goo/addons/physicspack/handlers/ColliderComponentHandler',
	'goo/addons/physicspack/components/ColliderComponent',
	'goo/addons/physicspack/colliders/Collider',
	'goo/addons/physicspack/colliders/SphereCollider',
	'goo/addons/physicspack/colliders/BoxCollider',
	'goo/addons/physicspack/colliders/PlaneCollider',
	'goo/addons/physicspack/colliders/CylinderCollider',
	'goo/math/Vector3',
	'goo/loaders/DynamicLoader',
	'test/loaders/Configs'
], function (
	World,
	ColliderComponentHandler,
	ColliderComponent,
	Collider,
	SphereCollider,
	BoxCollider,
	PlaneCollider,
	CylinderCollider,
	Vector3,
	DynamicLoader,
	Configs
) {
	'use strict';

	describe('ColliderComponentHandler', function () {
		var loader;

		beforeEach(function () {
			var world = new World();
			loader = new DynamicLoader({
				world: world,
				rootPath: './',
				ajax: false
			});
		});

		it('loads an entity with collider component', function (done) {
			var config = Configs.entity(['collider']);

			config.components.collider.isTrigger = true;
			config.components.collider.friction = 0.5;
			config.components.collider.restitution = 0.6;

			loader.preload(Configs.get());
			loader.load(config.id).then(function (entity) {
				expect(entity.colliderComponent).toEqual(jasmine.any(ColliderComponent));
				expect(entity.colliderComponent.isTrigger).toBe(true);
				expect(entity.colliderComponent.material.friction).toBe(0.5);
				expect(entity.colliderComponent.material.restitution).toBe(0.6);
				done();
			});
		});

		it('loads an entity with with a BoxCollider', function (done) {
			var config = Configs.entity();
			config.components.collider = Configs.component.collider('Box');
			config.components.collider.shapeOptions.halfExtents = [1, 2, 3];
			loader.preload(Configs.get());
			loader.load(config.id).then(function (entity) {
				expect(entity.colliderComponent).toEqual(jasmine.any(ColliderComponent));
				expect(entity.colliderComponent.collider).toEqual(jasmine.any(BoxCollider));
				expect(entity.colliderComponent.collider.halfExtents).toEqual(new Vector3(1, 2, 3));
				done();
			});
		});

		it('loads an entity with with a PlaneCollider', function (done) {
			var config = Configs.entity();
			config.components.collider = Configs.component.collider('Plane');
			loader.preload(Configs.get());
			loader.load(config.id).then(function (entity) {
				expect(entity.colliderComponent).toEqual(jasmine.any(ColliderComponent));
				expect(entity.colliderComponent.collider).toEqual(jasmine.any(PlaneCollider));
				done();
			});
		});

		it('loads an entity with with a CylinderCollider', function (done) {
			var config = Configs.entity();
			config.components.collider = Configs.component.collider('Cylinder');
			config.components.collider.shapeOptions.height = 2;
			config.components.collider.shapeOptions.radius = 3;
			loader.preload(Configs.get());
			loader.load(config.id).then(function (entity) {
				expect(entity.colliderComponent).toEqual(jasmine.any(ColliderComponent));
				expect(entity.colliderComponent.collider).toEqual(jasmine.any(CylinderCollider));
				expect(entity.colliderComponent.collider.height).toEqual(2);
				expect(entity.colliderComponent.collider.radius).toEqual(3);
				done();
			});
		});

		it('manages to update between collider types', function (done) {
			var component;
			var config = Configs.entity();
			var sphereConfig = Configs.component.collider('Sphere');
			var boxConfig = Configs.component.collider('Box');
			config.components.collider = sphereConfig;
			loader.preload(Configs.get());
			loader.load(config.id).then(function (entity) {
				component = entity.colliderComponent;
				expect(component.collider).toEqual(jasmine.any(SphereCollider));
				expect(component.worldCollider).toEqual(jasmine.any(SphereCollider));
				config.components.collider = boxConfig;
				return loader.update(config.id, config);
			}).then(function (entity) {
				expect(entity.colliderComponent).toBe(component);
				expect(entity.colliderComponent.collider).toEqual(jasmine.any(BoxCollider));
				expect(entity.colliderComponent.worldCollider).toEqual(jasmine.any(BoxCollider));
				done();
			});
		});
	});
});