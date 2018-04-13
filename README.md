# superagent-elasticserach
[![NPM version][npm-image]][npm-url] [![NPM DM][npm-dm-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]

> [Elasticsearch](https://github.com/elastic/elasticsearch-js) javascript connection handler for [Superagent](https://github.com/visionmedia/superagent)


## Why?
Superagent is widely used and it can easily be made to understand kerberos, in-house CAs and more. This is designed
to allow you to pass in any superagent like-object as well as get a callback before the request is sent so you can
take an action per request (e.g. set a Authenticate token).

## Usage
### Simple
```javascript
const elasticsearch = require('elasticsearch');
const SuperagentConnector = require('superagent-elasticsearch');

client = new elasticsearch.Client({
    host,
    log: 'debug',
    connectionClass: SuperagentConnector,
});
```

### Kerberos
```javascript
const elasticsearch = require('elasticsearch');
const SuperagentConnector = require('superagent-elasticsearch');

const beforeEachRequest = (r) => async {
    const token = await getToken(r.url);
    r.set('Authorization', `Negotiate ${token}`);
    return;
};
client = new elasticsearch.Client({
    host,
    log: 'debug',
    connectionClass: SuperagentConnector,
    superagentConfig: {beforeEachRequest}
});
```
Recommended reading: https://www.npmjs.com/package/kerberos
https://gist.github.com/dmansfield/c75817dcacc2393da0a7#file-http_client_spnego-js-L20

## API
In the config of `elasticsearch`, pass a `superagentConfig` config object. Parameters documented in the constructor,
as well as tested in `./tests`.

License
-------------
[Apache-2.0 License](http://www.apache.org/licenses/LICENSE-2.0)

[npm-url]: https://npmjs.org/package/superagent-elasticsearch
[npm-image]: https://badge.fury.io/js/superagent-elasticsearch.png
[npm-dm-image]: https://img.shields.io/npm/dm/superagent-elasticsearch.svg

[travis-url]: http://travis-ci.org/mlucool/superagent-elasticsearch
[travis-image]: https://secure.travis-ci.org/mlucool/superagent-elasticsearch.png?branch=master

[coveralls-url]: https://coveralls.io/github/mlucool/superagent-elasticsearch?branch=master
[coveralls-image]: https://coveralls.io/repos/mlucool/superagent-elasticsearch/badge.svg?branch=master&service=github

[depstat-url]: https://david-dm.org/mlucool/superagent-elasticsearch
[depstat-image]: https://david-dm.org/mlucool/superagent-elasticsearch.png
