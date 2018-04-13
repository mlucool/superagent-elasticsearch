const superagent = require('superagent'); // atypical import name, but it's less confusing
const HttpConnector = require('elasticsearch/src/lib/connectors/http');

class SuperagentConnector extends HttpConnector {
    /**
     * Connector that uses superagent over other modules. This both more portable and
     * allows for kerberos
     *
     * @param host See elastic doc, we just forward on
     * @param config Extends the one in elastic doc with a .superagent config object
     * @param {Object} config.superagentConfig Options for this connector
     * @param {Object} [config.superagentConfig.request] Replace the superagent used with a custom one
     * @param {function(object): Promise} [config.superagentConfig.beforeEachRequest] After a request is setup, this is
     * called for any final changes before we call end. This is a good place to do things like set a Negotiate token in a header
     */
    constructor(host, config) {
        super(host, config);
        this._superagent = superagent;
        this._beforeEachRequest = () => Promise.resolve();

        if (config.superagentConfig) {
            if (config.superagentConfig.request) {
                this._superagent = config.superagentConfig.request;
            }
            if (config.superagentConfig.beforeEachRequest) {
                this._beforeEachRequest = config.superagentConfig.beforeEachRequest;
            }
        }
        this.request = this.request.bind(this);
    }

    /**
     * Creates the request from the passed params and the superclasses reqParams
     *
     * @param params
     * @param reqParams
     * @return {*}
     * @private
     */
    _createRequest(params, reqParams) {
        // eslint-disable-next-line max-len
        const url = `${reqParams.protocol}//${reqParams.hostname}${reqParams.port ? `:${reqParams.port}` : ''}${reqParams.path}`;
        const r = this._superagent(reqParams.method, url);
        if (reqParams.agent) {
            r.agent(reqParams.agent); // This is how we reuse connections
        }
        if (reqParams.headers) {
            r.set(reqParams.headers);
        }
        if (params.body) {
            r.send(params.body);
        }

        return r;
    }

    request(params, cb) {
        const reqParams = this.makeReqParams(params);

        const r = this._createRequest(params, reqParams);
        this._beforeEachRequest(r)
            .then(() => {
                // End matches better to this cb style this expects than 'then'
                r.end((err, ret) => {
                    // TODO: This will parse the text in this.body. For performance it should be avoided by using pipe
                    cb(err, ret && ret.text);
                });
            })
            .catch((err) => cb(err));

        return r.abort; // Cancel
    }
}

module.exports = SuperagentConnector;
