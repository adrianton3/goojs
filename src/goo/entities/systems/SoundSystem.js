define([
	'goo/entities/systems/System',
	'goo/sound/AudioContext',
	'goo/math/Vector3',
	'goo/math/MathUtils',
	'goo/entities/SystemBus',
	'goo/util/ObjectUtil',
	'goo/math/Matrix4x4',
	'goo/math/Transform'
],
/** @lends */
function(
	System,
	AudioContext,
	Vector3,
	MathUtils,
	SystemBus,
	_,
	Matrix4x4,
	Transform
) {
	'use strict';
	/**
	 * @class System responsible for sound
	 */
	function SoundSystem() {
		if (!AudioContext) {
			console.warn('Cannot create soundsystem, webaudio not supported');
			return;
		}
		System.call(this, 'SoundSystem', ['SoundComponent', 'TransformComponent']);

		this.entities = [];
		this._outNode = AudioContext.createGain();
		this._outNode.connect(AudioContext.destination);
		this._wetNode = AudioContext.createGain();
		this._wetNode.connect(this._outNode);
		this._convolver = AudioContext.createConvolver();
		this._convolver.connect(this._wetNode);

		this._listener = AudioContext.listener;
		this._listener.dopplerFactor = 0;

		// REVIEW These won't be used since the camera is still
		this._position = new Vector3();
		this._oldPosition = new Vector3();
		this._velocity = new Vector3();
		this._orientation = new Vector3();

		this._camera = null;
		// REVIEW These won't be used
		this._up = new Vector3();
		this._left = new Vector3();

		this._settings = {
			rolloffFactor: 0.4,
			maxDistance: 100
		};
		this._wetNode.gain.value = 0.2;

		this._pausedSounds = {};

		var that = this;
		SystemBus.addListener('goo.setCurrentCamera', function (camConfig) {
			that._camera = camConfig.camera;
		});
	}

	SoundSystem.prototype = Object.create(System.prototype);
	SoundSystem.prototype.constructor = SoundSystem;

	/**
	 * Connect sound components output nodes to sound system buses. Called by world.process()
	 * @param {Entity} entity
	 * @private
	 */
	SoundSystem.prototype.inserted = function(entity) {
		entity.soundComponent.connectTo({
			dry: this._outNode,
			wet: this._convolver
		});
	};

	/**
	 * Be sure to stop all playing sounds when a component is removed. Called by world.process()
	 * Sometimes this has already been done by the loader
	 * @param {Entity} entity
	 * @private
	 */
	SoundSystem.prototype.deleted = function(entity) {
		if (entity.soundComponent) {
			var sounds = entity.soundComponent.sounds;
			for (var i = 0; i < sounds.length; i++) {
				sounds[i].stop();
			}
			entity.soundComponent.connectTo(this._outNode);
		}
	};

	/**
	 * Update the environmental sound system properties
	 * @param {object} [config]
	 * @param {number} [config.dopplerFactor] How much doppler effect the sound will get.
	 * @param {number} [config.rolloffFactor] How fast the sound fades with distance.
	 * @param {number} [config.maxDistance] After this distance, sound will keep its volume.
	 * @param {number} [config.volume] Will be clamped between 0 and 1.
	 * @param {number} [config.reverb] Will be clamped between 0 and 1.
	 */
	SoundSystem.prototype.updateConfig = function(config) {
		if (!AudioContext) {
			console.warn('Webaudio not supported');
			return;
		}
		_.extend(this._settings, config);
		if (config.dopplerFactor !== undefined) {
			this._listener.dopplerFactor = config.dopplerFactor * 0.05;
		}
		if (config.volume !== undefined) {
			this._outNode.gain.value = MathUtils.clamp(config.volume, 0, 1);
		}
		if (config.reverb !== undefined) {
			this._wetNode.gain.value = MathUtils.clamp(config.reverb, 0, 1);
		}
	};

	/**
	 * Set the reverb impulse response
	 * @param {AudioBuffer} [audioBuffer] if empty will also empty existing reverb
	 */
	SoundSystem.prototype.setReverb = function(audioBuffer) {
		if (!AudioContext) {
			console.warn('Webaudio not supported');
			return;
		}
		this._wetNode.disconnect();
		if(!audioBuffer && this._wetNode) {
			this._convolver.buffer = null;
		} else {
			this._convolver.buffer = audioBuffer;
			this._wetNode.connect(this._outNode);
		}
	};

	/**
	 * Pause the sound system and thereby all sounds in the scene
	 */
	SoundSystem.prototype.pause = function() {
		if (this._pausedSounds) { return; }
		this._pausedSounds = {};
		for (var i = 0; i < this.entities.length; i++) {
			var sounds = this.entities[i].soundComponent.sounds;
			for (var j = 0; j < sounds.length; j++) {
				var sound = sounds[j];
				if (sound.isPlaying()) {
					sound.pause();
					this._pausedSounds[sound.id] = true;
				}
			}
		}
	};

	/**
	 * Stopping the sound system and all sounds in scene
	 */
	SoundSystem.prototype.stop = function() {
		for (var i = 0; i < this.entities.length; i++) {
			var sounds = this.entities[i].soundComponent.sounds;
			for (var j = 0; j < sounds.length; j++) {
				var sound = sounds[j];
				sound.stop();
			}
		}
		this._pausedSounds = null;
	};

	/**
	 * Resumes playing of all sounds that were paused
	 */
	SoundSystem.prototype.resume = function() {
		if (!this._pausedSounds) { return; }
		for (var i = 0; i < this.entities.length; i++) {
			var sounds = this.entities[i].soundComponent.sounds;
			for (var j = 0; j < sounds.length; j++) {
				var sound = sounds[j];
				if (this._pausedSounds[sound.id]) {
					sound.play();
				}
			}
		}
		this._pausedSounds = null;
	};

	SoundSystem.prototype.process = function(entities, tpf) {
		if (!AudioContext) {
			// This should never happen because system shouldn't process
			return;
		}
		this.entities = entities;
		var mvInv;
		// REVIEW Don't create new objects in loops
		// Also, we only need a Matrix4x4
		// Also, we could just send the mvInv into component.process
		var relativeTransform = new Transform();

		// var viewMat = this._camera.getViewMatrix()
		for (var i = 0; i < entities.length; i++) {
			var component = entities[i].soundComponent;

			component._attachedToCamera = (entities[i].cameraComponent && entities[i].cameraComponent.camera === this._camera);

			/* REVIEW
			 * if (this._camera && entity.cameraComponent && entity.cameraComponent.camera === this._camera) {
			 *   component.process(this._settings, null, tpf);
			 * } else {
			 *   component.process(this._settings, viewMat, tpf);
			 * }
			 */
			// Give the transform relative to the camera
			if(this._camera && !component._attachedToCamera){
				var cam = this._camera;
				if(!mvInv){
					mvInv = cam.getViewMatrix();
				}
				Matrix4x4.combine(mvInv, entities[i].transformComponent.worldTransform.matrix, relativeTransform.matrix);
			}
			component.process(this._settings, relativeTransform, tpf);
		}

		// REVIEW All this is now unnecessary
		if (this._camera) {
			var cam = this._camera;

			if(!mvInv){
				mvInv = cam.getViewMatrix();
			}

			// Do we need to rotate these?
			this._orientation.setd(0,0,-1);
			this._up.setd(0,1,0);

			// Everything is relative to the camera
			this._listener.setPosition(0, 0, 0);
			this._listener.setVelocity(0, 0, 0);
			var od = this._orientation.data;
			var ud = this._up.data;
			this._listener.setOrientation(
				od[0], od[1], od[2],
				ud[0], ud[1], ud[2]
			);
		}
	};

	return SoundSystem;
});