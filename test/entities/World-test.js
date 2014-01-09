define([
	'goo/entities/World',
	'goo/entities/systems/System',
	'goo/entities/components/Component',
	'goo/shapes/Box',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Camera',
	'goo/renderer/light/PointLight'
], function(
	World,
	System,
	Component,
	Box,
	Material,
	ShaderLib,
	Camera,
	PointLight
) {
	'use strict';

	describe('World with Systems', function() {
		var world;
		beforeEach(function() {
			world = new World();
		});

		it ('adds a system with default priority to the world', function() {
			var systemA = { type: 'A', priority: 0 };
			var systemB = { type: 'B', priority: 0 };

			world.setSystem(systemA);
			world.setSystem(systemB);

			expect(world._systems).toEqual([systemA, systemB]);
		});
		it ('adds a system with high priority to the world', function() {
			var systemA = { type: 'A', priority: 0 };
			var systemB = { type: 'B', priority: 0 };
			var systemC = { type: 'B', priority: -1 };

			world.setSystem(systemA);
			world.setSystem(systemB);
			world.setSystem(systemC);

			expect(world._systems).toEqual([systemC, systemA, systemB]);
		});
		it ('adds a system with low priority to the world', function() {
			var world = new World();

			var systemA = { type: 'A', priority: 0 };
			var systemB = { type: 'B', priority: 0 };
			var systemC = { type: 'C', priority: 5 };

			world.setSystem(systemA);
			world.setSystem(systemB);
			world.setSystem(systemC);

			expect(world._systems).toEqual([systemA, systemB, systemC]);
		});
		it ('adds a system with medium priority to the world', function() {
			var systemA = { type: 'A', priority: 3 };
			var systemB = { type: 'B', priority: 1 };
			var systemC = { type: 'C', priority: 2 };

			world.setSystem(systemA);
			world.setSystem(systemB);
			world.setSystem(systemC);

			expect(world._systems).toEqual([systemB, systemC, systemA]);
		});

		describe('World with components', function() {
			// Cucumber system
			function CucumberSystem() {
				System.call(this, 'CucumberSystem', ['CucumberComponent']);
			}
			CucumberSystem.prototype = Object.create(System.prototype);
			CucumberSystem.prototype.inserted = function() {};
			CucumberSystem.prototype.deleted = function() {};
			CucumberSystem.prototype.addedComponent = function() {};
			CucumberSystem.prototype.removedComponent = function() {};

			// Cucumber component
			function CucumberComponent() {
				this.type = 'CucumberComponent';
			}

			var cucumberComponent, cucumberSystem, entity;

			beforeEach(function() {
				entity = world.createEntity();
				entity.addToWorld();
				// Process to prevent TransformComponent trigger addedComponent call on CucumberSystem
				world.process();

				cucumberSystem = new CucumberSystem();
				world.setSystem(cucumberSystem);
				cucumberComponent = new CucumberComponent();

				spyOn(cucumberSystem, 'inserted');
				spyOn(cucumberSystem, 'deleted');
				spyOn(cucumberSystem, 'addedComponent');
				spyOn(cucumberSystem, 'removedComponent');
			});

			CucumberComponent.prototype = Object.create(Component.prototype);

			it('get added call when components in the interest list are added', function() {
				entity.setComponent(cucumberComponent);
				world.process();
				expect(cucumberSystem.inserted).toHaveBeenCalled();
				expect(cucumberSystem.addedComponent).toHaveBeenCalled();
			});
			it('gets deleted call when components in the interest list are deleted', function() {
				entity.setComponent(cucumberComponent);
				world.process();
				entity.clearComponent('CucumberComponent');
				world.process();
				expect(cucumberSystem.deleted).toHaveBeenCalled();
				expect(cucumberSystem.removedComponent).toHaveBeenCalled();
			});
			it('gets no update calls when deleting a non existant component', function() {
				entity.clearComponent('CucumberComponent');
				world.process();
				expect(cucumberSystem.inserted).not.toHaveBeenCalled();
				expect(cucumberSystem.deleted).not.toHaveBeenCalled();
				expect(cucumberSystem.addedComponent).not.toHaveBeenCalled();
				expect(cucumberSystem.removedComponent).not.toHaveBeenCalled();
			});
			it('can create a typical entity holding all sorts of stuff in random order', function() {
				var camera = new Camera(45, 1, 1, 1000);
				var meshData = new Box();
				var material = Material.createMaterial(ShaderLib.simple);
				var light = new PointLight();
				var entity = world.createEntity(camera, meshData, {run:function(){}}, 'entitate', material, light);
				expect(entity.toString()).toBe('entitate');
				expect(entity.hasComponent('MeshDataComponent')).toBeTruthy();
				expect(entity.hasComponent('MeshRendererComponent')).toBeTruthy();
				expect(entity.hasComponent('LightComponent')).toBeTruthy();
				expect(entity.hasComponent('CameraComponent')).toBeTruthy();
				expect(entity.hasComponent('ScriptComponent')).toBeTruthy();
			});
		});

	});
});