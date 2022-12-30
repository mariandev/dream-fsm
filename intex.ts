type StateKey<T extends object> = T[keyof T];
type GenericStateKey = number | string

export class DreamFSM<TStates extends object> {
    #connections: {[from: GenericStateKey]: {[to: GenericStateKey]: () => boolean}} = {};
    #listeners: {[from: GenericStateKey]: {[to: GenericStateKey]: () => void}} = {};
    #onEnterListeners: {[from: GenericStateKey]: () => void} = {};
    #onExitListeners: {[from: GenericStateKey]: () => void} = {};

    constructor(private states: TStates, private initialState: StateKey<TStates>) {

    }

    public AddConnection(from: StateKey<TStates>, to: StateKey<TStates>, transitionCondition: () => boolean) {
        this.#connections[from as GenericStateKey] ??= {};
        this.#connections[from as GenericStateKey][to as GenericStateKey] = transitionCondition;
    }
    
    public AddListener(from: StateKey<TStates>, to: StateKey<TStates>, listener: () => void) {
        this.#listeners[from as GenericStateKey] ??= {};
        this.#listeners[from as GenericStateKey][to as GenericStateKey] = listener;
    }
    public RemoveListener(from: StateKey<TStates>, to: StateKey<TStates>, listener: () => void) {}

    public AddListenerOnEnter(from: StateKey<TStates>, listener: () => void) {
        this.#onEnterListeners[from as GenericStateKey] = listener;
    }
    public RemoveListenerOnEnter(from: StateKey<TStates>, listener: () => void) {}
    
    public AddListenerOnExit(from: StateKey<TStates>, listener: () => void) {
        this.#onExitListeners[from as GenericStateKey] = listener;
    }
    public RemoveListenerOnExit(from: StateKey<TStates>, listener: () => void) {}

    public Update() {}
}

enum Test {
    Test1, 
    Test2
}

const fsm = new DreamFSM(Test, Test.Test2);
fsm.AddConnection(Test.Test1, Test.Test2, () => Math.random() > 0.5);