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
	 * @type {Object.<string, Object.<DreamFSM.ListenerType, Function[]>>}
	 */
	var listeners = {};

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
	 * @param {string} state
	 * @param {Function} listener
	 * @param {DreamFSM.ListenerType} [type=DreamFSM.ListenerType.OnEnter]
	 * @return {void}
	 */
	this.AddListener = function(state, listener, type) {
		type = typeof type === "undefined" ? DreamFSM.ListenerType.OnEnter : type;

		if(states.indexOf(state) === -1) {
			throw new Error("DreamFSM: State '" + state + "' is not part of the initial set. Correct states: '" + states.join(", ") + "'");
		}

		if(typeof listeners[state] === "undefined") {
			listeners[state] = {};
		}

		if(typeof listeners[state][type] === "undefined") {
			listeners[state][type] = [];
		}

		listeners[state][type].push(listener);
	};

	/**
	 * @param {string} state
	 * @param {Function} listener
	 * @param {DreamFSM.ListenerType} type
	 * @return {void}
	 */
	this.RemoveListener = function(state, listener, type) {
		if(typeof listeners[state] === "undefined") return;
		if(typeof listeners[state][type] === "undefined") return;

		var idx = listeners[state][type].indexOf(listener);

		if(idx === -1) return;

		listeners[state][type].splice(idx, 1);
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
				FireListeners(state, DreamFSM.ListenerType.OnExit);
				state = outgoingState;
				FireListeners(state, DreamFSM.ListenerType.OnEnter);

				break;
			}
		}
	};

	/**
	 * @param {string} state
	 * @param {DreamFSM.ListenerType} type
	 * @return {void}
	 */
	var FireListeners = function(state, type) {
		if(typeof listeners[state] === "undefined") return;
		if(typeof listeners[state][type] === "undefined") return;

		var toCall = listeners[state][type];
		for(var index in toCall) {
			toCall[index]();
		}
	}
}

/**
 * @readonly
 * @enum {number}
 */
DreamFSM.ListenerType = {
	OnEnter: 0,
	OnExit: 1
};
