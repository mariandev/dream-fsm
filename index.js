/**
 * @param {string[]} states
 * @param {string} start
 * @constructor
 */
function DreamFSM(states, start) {
	/**
	 * @type {Object.<string, Object.<string, Function.<boolean>>>}
	 */
	var connections = {};

	/**
	 * @type {Object.<string, Object.<string, Function[]>>}
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
	var state = start;

	var haltUpdate = false;

	/**
	 * @return {string}
	 */
	this.State = function() {
		return state;
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
	this.AddConnectionListener = function(fromState, toState, listener) {
		if(typeof fromState === "undefined") fromState = ANY_STATE;
		if(typeof toState === "undefined") toState = ANY_STATE;

		if(typeof listeners[fromState] === "undefined") listeners[fromState] = {};
		if(typeof listeners[fromState][toState] === "undefined") listeners[fromState][toState] = [];

		listeners[fromState][toState].push(listener);
	};

	/**
	 * @param {string|undefined} fromState
	 * @param {string|undefined} toState
	 * @param {Function} listener
	 * @return {void}
	 */
	this.RemoveConnectionListener = function(fromState, toState, listener) {
		if(typeof fromState === "undefined") fromState = ANY_STATE;
		if(typeof toState === "undefined") toState = ANY_STATE;

		if(typeof listeners[fromState] === "undefined") return;
		if(typeof listeners[fromState][toState] === "undefined") return;

		var idx = listeners[fromState][toState].indexOf(listener);

		if(idx === -1) return;

		listeners[fromState][toState].splice(idx, 1);
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
			var outgoingState = outgoingStates[outgoingStateKey];

			if(current[outgoingState]()) {
				FireListeners(state, ANY_STATE);
				FireListeners(state, outgoingState);

				state = outgoingState;

				FireListeners(ANY_STATE, outgoingState);

				break;
			}
		}
	};

	/**
	 * @param {string} fromState
	 * @param {string} toState
	 * @return {void}
	 */
	var FireListeners = function(fromState, toState) {
		if(typeof listeners[fromState] === "undefined") return;
		if(typeof listeners[fromState][toState] === "undefined") return;

		var toCall = listeners[fromState][toState];
		for(var index in toCall) {
			toCall[index]();
		}
	};
}
