module.exports = {
    env: {
        mocha: true
    },
    rules: {
        'no-unused-expressions': 0, // chai statements violate this
        'func-names': 0, // It is useful to have anonymous functions in mocha it/describe blocks because we need the context at times
        'react/no-find-dom-node': 0 // Occasionally Useful for testing
    }
};
