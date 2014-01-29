define([
	'goo/loaders/handlers/ComponentHandler',
	'goo/fsmpack/statemachine/StateMachineComponent',
	'goo/util/rsvp'
], function(
	ComponentHandler,
	StateMachineComponent,
	RSVP
	) {
	"use strict";

	/*
	 * @class For handling loading of state machine components
	 * @constructor
	 * @param {World} world The goo world
	 * @param {function} getConfig The config loader function. See {@see DynamicLoader._loadRef}.
	 * @param {function} updateObject The handler function. See {@see DynamicLoader.update}.
	 * @extends ComponentHandler
	 */
	function StateMachineComponentHandler() {
		ComponentHandler.apply(this, arguments);
		this._type = 'StateMachineComponent';
	}

	StateMachineComponentHandler.prototype = Object.create(ComponentHandler.prototype);
	StateMachineComponentHandler.prototype.constructor = StateMachineComponentHandler;
	ComponentHandler._registerClass('stateMachine', StateMachineComponentHandler);

	/*
	 * Create statemachine component 
	 * @returns {StateMachineComponent} the created component object
	 * @private
	 */
	StateMachineComponentHandler.prototype._create = function() {
		return new StateMachineComponent();
	};

	/**
	 * Update engine statemachine component object based on the config.
	 * @param {Entity} entity The entity on which this component should be added.
	 * @param {object} config
	 * @param {object} options
	 * @returns {RSVP.Promise} promise that resolves with the component when loading is done.
	 */
	 StateMachineComponentHandler.prototype.update = function(entity, config, options) {
		var that = this;
		return ComponentHandler.prototype.update.call(this, entity, config, options).then(function(component) {
			var promises = [];
			for (var key in config.machines) {
				promises.push(that._load(config.machines[key].machineRef, options));
			}
			return RSVP.all(promises).then(function(machines) {
				// Adding new machines
				for (var i = 0; i < machines.length; i++) {
					if (component._machines.indexOf(machines[i]) === -1) {
						component.addMachine(machines[i]);
					}
				}
				// Removing old machines
				for (var i = 0; i < component._machines.length; i++) {
					if (machines.indexOf(component._machines[i]) === -1) {
						component.removeMachine(component._machines[i]);
					}
				}
				return component;
			});
		});
	};

	return StateMachineComponentHandler;
});