define([
	'goo/entities/EntityUtils',
	'goo/util/MeshBuilder',
	'goo/math/Transform',
	'goo/math/Vector3',
	'goo/renderer/bounds/BoundingBox',
	'goo/renderer/bounds/BoundingSphere'
],
/** @lends */
function(
	EntityUtils,
	MeshBuilder,
	Transform,
	Vector3,
	BoundingBox,
	BoundingSphere
) {
	"use strict";

	/**
	 * @class Runs a mesh combine optimization on the whole scene, based on
	 * material, components etc
	 * @param {World} gooWorld An instance of a goo.world object
	 * @param {number} [gridCount=1] Number of grid segments to split the world in during combine
	 */
	function EntityCombiner(gooWorld, gridCount) {
		this.world = gooWorld;
		this.gridCount = gridCount || 1;
	}

	/**
	 * Runs the combiner
	 */
	EntityCombiner.prototype.combine = function() {
		this.world.process();

		var topEntities = this.world.entityManager.getTopEntities();
		this.gridSize = this._calculateBounds(topEntities) / this.gridCount;
		this._combineList(topEntities);
	};

	EntityCombiner.prototype._combineList = function(entities) {
		var removeOld = true;

		var root = this.world.createEntity('root');
		root.addToWorld();
		for (var i = 0; i < entities.length; i++) {
			root.attachChild(entities[i]);
		}

		var baseSubs = new Map();
		this._buildSubs(root, baseSubs);

		var keys = baseSubs.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var entity = keys[i];
			var combineList = baseSubs.get(entity);

			this._combine(entity, combineList, removeOld);
		}
	};

	EntityCombiner.prototype._buildSubs = function(entity, baseSubs, subs) {
		if (entity.hidden || entity.skip || entity.animationComponent || entity.particleComponent) {
			return;
		}

		// will be based on static setting when we add it to Create
		// if (!subs || !entity.isStatic || entity.fSMComponent) {
		if (!subs || entity.scriptComponent || entity.fSMComponent) {
			subs = [];
			baseSubs.put(entity, subs);
		}

		if (entity.meshDataComponent && entity.meshRendererComponent &&
			entity.meshRendererComponent.worldBound) {
			subs.push(entity);
		}

		for (var i = 0; i < entity.transformComponent.children.length; i++) {
			var child = entity.transformComponent.children[i];
			this._buildSubs(child.entity, baseSubs, subs);
		}
	};

	EntityCombiner.prototype._combine = function(root, combineList, removeOld) {
		var rootTransform = root.transformComponent.worldTransform;
		var invertTransform = new Transform();
		var calcTransform = new Transform();
		rootTransform.invert(invertTransform);

		var entities = new Map();
		for (var i = 0; i < combineList.length; i++) {
			var entity = combineList[i];

			var key = entity.meshRendererComponent.materials[0];

			var attributeMap = entity.meshDataComponent.meshData.attributeMap;
			var key2 = Object.keys(attributeMap);
			key2.sort();
			key2 = key2.join('_');

			var xBucket = entity.meshRendererComponent.worldBound.center.x / this.gridSize;
			var zBucket = entity.meshRendererComponent.worldBound.center.z / this.gridSize;
			key2 = key2 + '_' + Math.round(xBucket) + '_' + Math.round(zBucket);

			var set = entities.get(key);
			if (!set) {
				set = new Map();
				entities.put(key, set);
			}
			var set2 = set.get(key2);
			if (!set2) {
				set2 = [];
				set.put(key2, set2);
			}

			set2.push(entity);
		}

		var sets = entities.getKeys();
		for (var i = 0; i < sets.length; i++) {
			var material = sets[i];
			var entities2 = entities.get(material);
			var sets2 = entities2.getKeys();
			for (var j = 0; j < sets2.length; j++) {
				var toCombine = entities2.get(sets2[j]);

				if (toCombine.length === 1) {
					continue;
				}

				var meshBuilder = new MeshBuilder();
				for (var k = 0; k < toCombine.length; k++) {
					var entity = toCombine[k];

					if (root !== entity) {
						calcTransform.multiply(invertTransform, entity.transformComponent.worldTransform);
					} else {
						calcTransform.setIdentity();
					}

					meshBuilder.addMeshData(entity.meshDataComponent.meshData, calcTransform);

					if (removeOld) {
						// Remove empty leaf children
						if (entity._components.length === 3 && entity.transformComponent.children.length === 0) {
							entity.removeFromWorld();
						} else {
							entity.clearComponent('meshDataComponent');
							entity.clearComponent('meshRendererComponent');
						}
					} else {
						entity.skip = true;
						entity.hidden = true;
					}
				}
				var meshDatas = meshBuilder.build();

				for (var key in meshDatas) {
					var entity = this.world.createEntity(meshDatas[key], material);
					entity.addToWorld();
					root.attachChild(entity);
				}
			}
		}
	};

	EntityCombiner.prototype._calculateBounds = function(entities) {
		var first = true;
		var wb = new BoundingBox();
		for (var i = 0; i < entities.length; i++) {
			var rootEntity = entities[i];
			EntityUtils.traverse(rootEntity, function(entity) {
				if (entity.meshRendererComponent && !entity.particleComponent) {
					if (first) {
						var bound = entity.meshRendererComponent.worldBound;
						if (bound instanceof BoundingBox) {
							bound.clone(wb);
						} else if (bound instanceof BoundingSphere) {
							wb.center.setv(bound.center);
							wb.xExtent = wb.yExtent = wb.zExtent = bound.radius;
						} else {
							wb.center.setv(Vector3.ZERO);
							wb.xExtent = wb.yExtent = wb.zExtent = 10;
						}

						first = false;
					} else {
						wb.merge(entity.meshRendererComponent.worldBound);
					}
				}
			});
		}
		return Math.max(wb.xExtent, wb.zExtent) * 2.0;
	};

	function Map() {
		var keys = [],
			values = [];

		return {
			put: function(key, value) {
				var index = keys.indexOf(key);
				if (index === -1) {
					keys.push(key);
					values.push(value);
				} else {
					values[index] = value;
				}
			},
			get: function(key) {
				return values[keys.indexOf(key)];
			},
			getKeys: function() {
				return keys;
			},
			getValues: function() {
				return values;
			}
		};
	}

	return EntityCombiner;
});