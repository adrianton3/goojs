define([
	'goo/loaders/handlers/ComponentHandler',
	'goo/entities/components/ScriptComponent',
	'goo/util/rsvp',
	'goo/util/ObjectUtils',
	'goo/util/PromiseUtils',
	'goo/entities/SystemBus',

	'goo/scripts/Scripts',
	'goo/scripts/ScriptUtils'
], function (
	ComponentHandler,
	ScriptComponent,
	RSVP,
	_,
	PromiseUtils,
	SystemBus,

	Scripts,
	ScriptUtils
) {
	'use strict';

	/**
	 * @hidden
	 */
	function ScriptComponentHandler() {
		ComponentHandler.apply(this, arguments);
		this._type = 'ScriptComponent';
	}

	ScriptComponentHandler.prototype = Object.create(ComponentHandler.prototype);
	ScriptComponentHandler.prototype.constructor = ScriptComponentHandler;
	ComponentHandler._registerClass('script', ScriptComponentHandler);

	ScriptComponentHandler.ENGINE_SCRIPT_PREFIX = 'GOO_ENGINE_SCRIPTS/';

	ScriptComponentHandler.prototype._prepare = function (/*config*/) {};

	ScriptComponentHandler.prototype._create = function () {
		return new ScriptComponent();
	};

	ScriptComponentHandler.prototype.update = function (entity, config, options) {
		var that = this;

		return ComponentHandler.prototype.update.call(this, entity, config, options)
		.then(function (component) {
			if (!component) { return; }

			return RSVP.all(_.map(config.scripts, function (instanceConfig) {
				return that._updateScriptInstance(instanceConfig, options);
			}, null, 'sortValue'))
			.then(function (scripts) {
				component.scripts = scripts;
				return component;
			});
		});
	};

	ScriptComponentHandler.prototype._updateScriptInstance = function (instanceConfig, options) {
		var that = this;

		return this._createOrLoadScript(instanceConfig)
		.then(function (script) {
			var newParameters = instanceConfig.options || {};
			if (script.parameters) {
				_.defaults(newParameters, script.parameters);
			}

			if (script.externals && script.externals.parameters) {
				ScriptUtils.fillDefaultValues(newParameters, script.externals.parameters);
			}

			// We need to duplicate the script so we can have multiple
			// similar scripts with different parameters.
			// TODO: Check if script exists in the component and just update it
			// instead of creating a new one.
			var newScript = Object.create(script);
			newScript.parameters = {};
			newScript.enabled = false;

			return that._setParameters(
				newScript.parameters,
				newParameters,
				script.externals,
				options
			)
			.then(_.constant(newScript));
		});
	}

	/**
	 * Depending on the reference specified in the script instance, creates an
	 * engine script or loads the referenced script.
	 *
	 * @param {object} instanceConfig
	 *        JSON configuration of the script instance. Should contain the
	 *        "scriptRef" property which refers to the script which is to be
	 *        loaded.
	 *
	 * @return {Promise}
	 *         A promise which is resolved with the referenced script.
	 *
	 * @private
	 */
	ScriptComponentHandler.prototype._createOrLoadScript = function (instanceConfig) {
		var ref = instanceConfig.scriptRef;
		var prefix = ScriptComponentHandler.ENGINE_SCRIPT_PREFIX
		var isEngineScript = ref.indexOf(prefix) === 0;

		if (isEngineScript) {
			return this._createEngineScript(ref.slice(prefix.length));
		} else {
			return this._load(ref, { reload: true });
		}
	}

	/**
	 * Creates a new instance of one of the default scripts provided by the
	 * engine.
	 *
	 * @param {Object} scriptName
	 *		The name of the script which is to be created.
	 *
	 * @returns {RSVP.Promise}
	 *		A promise which is resolved with the new script.
	 *
	 * @private
	 */
	ScriptComponentHandler.prototype._createEngineScript = function (scriptName) {
		var script = Scripts.create(scriptName);
		if (!script) {
			throw new Error('Unrecognized script name');
		}

		script.id = ScriptComponentHandler.ENGINE_SCRIPT_PREFIX + scriptName;
		script.enabled = false;

		SystemBus.emit('goo.scriptExternals', {
			id: script.id,
			externals: script.externals
		});

		return PromiseUtils.resolve(script);
	}

	/**
	 * Sets the parameters of a script instance from the json configuration.
	 *
	 * @param {object} parameters
	 *        Parameters of the new script instance which are to be filled
	 *        out according to the json config and the script externals.
	 * @param {object}
	 *        json configuration from which the parameter values are to be
	 *        extracted.
	 * @param {object} externals
	 *        Parameter descriptor as defined in a script's external.parameters
	 *        object.
	 * @param options
	 *        DynamicLoader options.
	 *
	 * @returns {Promise}
	 *
	 * @private
	 */
	ScriptComponentHandler.prototype._setParameters = function (parameters, config, externals, options) {
		var that = this;

		// is externals ever falsy?
		if (!externals || !externals.parameters) {
			return PromiseUtils.resolve();
		}

		var promises = externals.parameters.map(function (external) {
			return that._setParameter(parameters, config[external.key], external, options);
		});

		parameters.enabled = config.enabled !== false;

		return RSVP.all(promises);
	};

	/**
	 * Sets a script parameter from the json configuration.
	 *
	 * @param {object} parameters
	 *        Script parameters object on which the parameter is to be set.
	 * @param {object} config
	 *        JSON configuration from which the parameter values are to be
	 *        extracted.
	 * @param {object} external
	 *        Parameter descriptor (type, key, etc).
	 * @param {object} options
	 *        DynamicLoader options.
	 *
	 * @returns {Promise}
	 *          A promise which is resolved when the parameter has been set.
	 *
	 * @private
	 */
	ScriptComponentHandler.prototype._setParameter = function (parameters, config, external, options) {
		var that = this;
		var key = external.key;
		var type = external.type;

		function setParam(value) {
			parameters[key] = value;
			return PromiseUtils.resolve();
		}

		function getInvalidParam() {
			if (external.default === undefined) {
				return _.deepClone(ScriptUtils.DEFAULTS_BY_TYPE[type]);
			} else {
				return _.deepClone(external.default);
			}
		}

		function setRefParam() {
			if (!config || config.enabled === false) {
				return setParam(null);
			}

			// Get wrapped ref (i.e. entityRef) and if none exists it is because
			// we got a direct ref.
			var ref = config[type + 'Ref'] || config;

			return that._load(ref, options).then(setParam);
		}

		if (!ScriptUtils.TYPE_VALIDATORS[type](config)) {
			return setParam(getInvalidParam())
		} else if (type === 'entity') {
			// For entities, because they can depend on themselves, we don't
			// wait for the load to be completed. It will eventually resolve
			// and the parameter will be set.
			setRefParam();
			return Promise.resolve();
		} else if (ScriptUtils.isRefType(type)) {
			return setRefParam();
		} else {
			return setParam(_.clone(config));
		}
	};

	return ScriptComponentHandler;
});