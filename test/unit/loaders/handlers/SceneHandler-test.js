define([
	'goo/entities/World',
	'goo/entities/Entity',
	'goo/loaders/DynamicLoader',
	'test/loaders/Configs'
], function (
	World,
	Entity,
	DynamicLoader,
	Configs
) {
	'use strict';

	describe('SceneHandler', function () {
		var loader;

		beforeEach(function () {
			var world = new World();
			loader = new DynamicLoader({
				world: world,
				rootPath: './',
				ajax: false
			});
		});

		it('loads a scene with entities', function (done) {
			var config = Configs.scene();
			loader.preload(Configs.get());
			loader.load(config.id).then(function (scene) {
				expect(scene.entities).toEqual(jasmine.any(Object));
				var entity;
				for (var key in scene.entities) {
					entity = scene.entities[key];
					break;
				}
				expect(entity).toEqual(jasmine.any(Entity));
				expect(entity._world._addedEntities).toContain(entity);
				done();
			});
		});
	});
});