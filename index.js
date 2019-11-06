/**
 * @param {string[]} states
 * @param {string} startState
 * @constructor
 */
function DreamFSM(states, startState) {
	var self = this;

	states = states.slice(0);

	/**
	 * @type {Object.<string, Object.<string, Function.<boolean>>>}
	 */
	var connections = {};

	/**
	 * @type {Object.<string, Object.<string, (function(fromState: string, toState: string): void)[]>>}
	 */
	var listeners = {};
	/**
	 * @const
	 * @type {string}
	 */
	var ANY_STATE = "__DreamFSMAnyState__";

	/**
	 * @type {string}
	 */
	var state = startState;

	/**
	 * @type {boolean}
	 */
	var haltUpdate = false;

	/**
	 * @return {string}
	 */
	this.State = function() {
		return state;
	};

	/**
	 * @param {string} state
	 * @void
	 */
	this.AddState = function(state) {
		states.push(state);
	};

	/**
	 * @param {string} fromState
	 * @param {string} toState
	 * @param {Function.<boolean>} transitionFn
	 * @return {void}
	 */
	this.AddConnection = function(fromState, toState, transitionFn) {
		if(states.indexOf(fromState) === -1) {
			throw new Error("DreamFSM: State '" + fromState + "' is not part of the initial set. Correct states: '" + states.join(", ") + "'");
		}

		if(states.indexOf(toState) === -1) {
			throw new Error("DreamFSM: State '" + toState + "' is not part of the initial set. Correct states: '" + states.join(", ") + "'");
		}

		if(typeof connections[fromState] === "undefined") {
			connections[fromState] = {};
		}

		if(typeof connections[fromState][toState] !== "undefined") {
			console.warn("DreamFSM: Connection '" + fromState + " > " + toState + "' was already declared and it has been overwritten.");
		}

		connections[fromState][toState] = transitionFn;
	};

	/**
	 * @param {string|undefined} fromState
	 * @param {string|undefined} toState
	 * @param {Function} listener
	 * @return {void}
	 */
	this.AddListener = function(fromState, toState, listener) {
		if(typeof fromState === "undefined") fromState = ANY_STATE;
		if(typeof toState === "undefined") toState = ANY_STATE;

		if(typeof listeners[fromState] === "undefined") listeners[fromState] = {};
		if(typeof listeners[fromState][toState] === "undefined") listeners[fromState][toState] = [];

		listeners[fromState][toState].push(listener);

		if(fromState === undefined && toState === state) {
			listener(undefined, startState);
		}
	};

	/**
	 * @param {string|undefined} fromState
	 * @param {string|undefined} toState
	 * @param {function(fromState: string, toState: string): void} listener
	 * @return {void}
	 */
	this.RemoveListener = function(fromState, toState, listener) {
		if(typeof fromState === "undefined") fromState = ANY_STATE;
		if(typeof toState === "undefined") toState = ANY_STATE;

		if(typeof listeners[fromState] === "undefined") return;
		if(typeof listeners[fromState][toState] === "undefined") return;

		var idx = listeners[fromState][toState].indexOf(listener);

		if(idx === -1) return;

		listeners[fromState][toState].splice(idx, 1);
	};

	/**
	 * @param {string|undefined} state
	 * @param {function(fromState: string, toState: string): void} listener
	 * @return {void}
	 */
	this.AddOnEnterListener = function(state, listener) {
		self.AddListener(undefined, state, listener);
	};

	/**
	 * @param {string|undefined} state
	 * @param {function(fromState: string, toState: string): void} listener
	 * @return {void}
	 */
	this.AddOnExitListener = function(state, listener) {
		self.AddListener(state, undefined, listener);
	};

	/**
	 * @param {string|undefined} state
	 * @param {function(fromState: string, toState: string): void} listener
	 * @return {void}
	 */
	this.RemoveOnEnterListener = function(state, listener) {
		self.RemoveListener(undefined, state, listener);
	};

	/**
	 * @param {string|undefined} state
	 * @param {function(fromState: string, toState: string): void} listener
	 * @return {void}
	 */
	this.RemoveOnExitListener = function(state, listener) {
		self.RemoveListener(state, undefined, listener);
	};

	/**
	 * @return {void}
	 */
	this.Update = function() {
		if(haltUpdate) return;

		const current = connections[state];

		if(typeof current === "undefined") {
			haltUpdate = true;
			return;
		}

		var outgoingStates = Object.keys(current);
		for(var outgoingStateKey in outgoingStates) {
			var currentState = state;
			var outgoingState = outgoingStates[outgoingStateKey];

			if(current[outgoingState]()) {
				FireListeners(currentState, ANY_STATE, currentState, outgoingState);
				FireListeners(currentState, outgoingState);

				state = outgoingState;

				FireListeners(ANY_STATE, outgoingState, currentState, outgoingState);

				FireListeners(ANY_STATE, ANY_STATE, currentState, outgoingState);

				break;
			}
		}
	};

	/**
	 * @param {string} fromState
	 * @param {string} toState
	 * @param {string} [realToState]
	 * @param {string} [realFromState]
	 * @return {void}
	 */
	var FireListeners = function(fromState, toState, realFromState, realToState) {
		if(typeof listeners[fromState] === "undefined") return;
		if(typeof listeners[fromState][toState] === "undefined") return;

		if(typeof realFromState === "undefined") realFromState = fromState;
		if(typeof realToState === "undefined") realToState = toState;

		var toCall = listeners[fromState][toState];

		var forOutsideFromState = fromState === ANY_STATE ? realFromState : fromState;
		var forOutsideToState = toState === ANY_STATE ? realToState : toState;

		for(var index in toCall) {
			toCall[index](forOutsideFromState, forOutsideToState);
		}
	};
}
