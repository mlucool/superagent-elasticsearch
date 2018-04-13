const SuperagentConnector = require('../src/SuperagentConnector');
const expect = require('chai').expect;
const Host = require('elasticsearch/src/lib/host');
const request = require('superagent');
const mocker = require('superagent-mock');
const superagentMockConfig = require('./superagentMockConfig');

describe('constructor', () => {
    let superagentMock;
    before(() => {
        superagentMock = mocker(request, superagentMockConfig, /*(log) => console.log('superagent call', log)*/);
    });
    after(() => {
        superagentMock.unset();
    });
    it('Can be configured with the default elasticsearch configuration', () => {
        expect(() => new SuperagentConnector(new Host(), {})).not.to.throw();
    });

    it('Can be configured to override the superagent module', () => {
        class MySuperagentLikeThing {
        }

        const mySuperagentLikeThing = new MySuperagentLikeThing();
        const connector = new SuperagentConnector(new Host(), {superagentConfig: {request: mySuperagentLikeThing}});
        expect(connector._superagent).to.eql(mySuperagentLikeThing);
    });

    it('Can be configured to have a function called before each request is sent', (cb) => {
        const beforeEachRequest = (r) => {
            r.set({iamATest: 'yesIam'});
            return Promise.resolve();
        };
        const connector = new SuperagentConnector(new Host('https://www.myeslastic.com:1234'),
            {
                superagentConfig: {beforeEachRequest, request},
            }
        );
        expect(connector._beforeEachRequest).to.eql(beforeEachRequest);

        connector.request({headers: {bar: 'baz'}, body: {query: 'aquery'}}, (err, data) => {
            if (err) {
                cb(err);
            }
            const dataAsJson = JSON.parse(data);
            expect(dataAsJson.headers).to.not.be.undefined;
            expect(dataAsJson.headers.iamATest).to.eql('yesIam');
            expect(dataAsJson.headers.bar).to.eql('baz');
            expect(dataAsJson.params.query).to.eql('aquery');
            cb();
        });
    });

    it('Returns errors correctly', (cb) => {
        const connector = new SuperagentConnector(new Host('https://averyveryveryninvalidurl.org'),
            {
                superagentConfig: {request}
            }
        );

        connector.request({}, (err, data) => {
            expect(err).to.be.an('error');
            cb();
        });
    });

    it('Returns errors correctly for bad user fns', (cb) => {
        const beforeEachRequest = (r) => Promise.reject(new Error('Some error'));
        const connector = new SuperagentConnector(new Host('https://averyveryveryninvalidurl.org'),
            {
                superagentConfig: {beforeEachRequest, request}
            }
        );

        connector.request({}, (err, data) => {
            expect(err).to.be.an('error');
            cb();
        });
    });
});
