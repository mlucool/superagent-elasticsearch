const superagent = require('superagent'); // atypical import name, but it's less confusing
const HttpConnector = require('elasticsearch/src/lib/connectors/http');
const url = require('url');

class SuperagentConnector extends HttpConnector {
    /**
     * Connector that uses superagent to make requests. See README for why you would want to do this.
     *
     * @param host See elastic doc, we just forward on to the parent
     * @param config See elastic doc. This extends it with a .superagentConfig object
     * @param {Object} config.superagentConfig Options for this connector
     * @param {Object} [config.superagentConfig.request] Replace the superagent used with a custom one. Useful for mocking and extending superagent first
     * @param {function(object): Promise} [config.superagentConfig.beforeEachRequest] After a request is setup, this is
     * called for any final changes before we call end. This is a good place to do things like set a 'Negotiate token'
     * in the header for SPNEGO (e.g. NTML/kerberos) support.
     */
    constructor(host, config) {
        super(host, config);
        // By default we are happy to work out of the box
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
        const reqObj = {}; // We build this like this because we don't have lodash
        ['protocol', 'hostname', 'port'].forEach((part) => {
            if (typeof reqParams[part] !== 'undefined') {
                reqObj[part] = reqParams[part];
            }
        });
        if (typeof reqParams.path !== 'undefined') {
            reqObj.pathname = reqParams.path; // translation
        }
        const reqURL = url.format(reqObj);
        const r = this._superagent(reqParams.method, reqURL);
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
                    // TODO: superagent parses the r.text and puts it into r.body. For performance we should use pipe so we don't double parse
                    cb(err, ret && ret.text);
                });
            })
            .catch((err) => cb(err));

        return r.abort; // Cancel
    }
}

module.exports = SuperagentConnector;
