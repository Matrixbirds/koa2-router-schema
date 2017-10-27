'use strict';

const app = require('./_app');
const supertest = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const lib = require('./index');
const schema = lib.schema;
const payload = require("./_params-schema");

require('mocha');
require('co-mocha');

describe("#schema", function () {
    let result;
    context("valid params", function () {
        let params = {
            data: {
                name: '1024',
                password: '1024'
            }
        };
        it ("payload return data", function () {
            result = schema('data', payload, params);
            expect(result.data.name).to.equal('1024');
            expect(result.data.password).to.equal('1024');
        })
        it ("should return data", function () {
            result = schema('data', `
                type data {
                    name: string!
                    password: string! };
            `, params);
            expect(result.data.name).to.equal('1024');
            expect(result.data.password).to.equal('1024');
        });
        it ("array!# should return data", function () {
            result = schema('data', `
            type data {
                attributes: array!
            }
            `, {
                data: {
                    attributes: [{item: 1}],
                }
            });
            expect(result.data.attributes.length).above(0);
        });
        it ("array!# should return origin plain array", function () {
            result = schema('data', `
            type data {
                attributes: array!
            }
            `, {
                data: {
                    attributes: [],
                }
            })
            expect(result.data.attributes.length).equal(0);
            expect(result.data.attributes[0]).to.equal(undefined);
        });
    });

    context("invalid params", function () {
        let params = {
            data: {
                name: 1,
                password: 0
            }
        };
        beforeEach(function () {
            result = schema('data', `
                type data {
                    name: string!
                    password: string!
                }
            `, params)
        });
        it ("should return errors", function () {
            expect(result.errors.data.name.reason).to.equal("params name value should be string!");
            expect(result.errors.data.name.type).to.equal("params types");
            expect(result.errors.data.password.reason).to.equal("params password value should be string!");
            expect(result.errors.data.password.type).to.equal("params types");
        });
        it ("array!# return errors", function () {
            result = schema('data', `
            type data {
                attributes: array!
            }
            `, {
                data: {
                    attributes: 0,
                }
            });
            expect(result.errors.data.attributes.type).to.equal("params types");
            expect(result.errors.data.attributes.reason).to.equal("params attributes value should be array!");
        });
    });
});

function request(app) {
  return supertest(app.listen());
}
// ctx[_error] = exports.errorHandler || function noop() {};
describe("POST /login", function () {
    let result;
    context("invalid request params", function () {
        it ("should response 400", function *() {
            result = yield request(app).post("/login").send({
                data: {
                    name: 1,
                    password: 1,
                }
            });
            expect(result.status).to.equal(400);
        })
    });

    context("valid request params", function () {
        it ("should response 200", function *() {
            result = yield request(app).post("/login").send({
                data: {
                    name: "1024",
                    password: "1024",
                    datetime: new Date("2017-01-02")
                }
            });
            expect(result.status).to.equal(200);
        });
    })
})

exports._app2 = function (routine) {

    const expose = Object.assign;

    const koa = require('koa');
    const Router = require('koa-router');
    const bodyParser = require('koa-bodyparser');
    const app = new koa();

    const schema = require('./index');

    const _json = schema._json;

    const router = require('koa-router')();

    const payload = require('./_params-schema');

    schema.errorHandler = function(ctx, next) {
        if (ctx[schema._json].errors && Object.entries(ctx[schema._json].errors).length)  {
            ctx.throw(400, 'params errors', { describe:  ctx[schema._json].errors});
        }
    }

    router.post('/login', schema('request', payload,
        async function(ctx, next) {
            ctx.status = 200;
            ctx.body = { data: ctx[_json].data };
          }
    ));

    app.use(routine);
    app.use(bodyParser());
    app.use(router.routes());
    return app;
}

describe("#_error", function () {
    it ("custom error handler", function *() {
        let resp = yield request(exports._app2(async function (ctx, next) {
            try {
                await next();
            } catch(err) {
                ctx.body = {
                    errors: err.describe
                };
                ctx.status = err.status;
                ctx.app.emit('error', err, ctx);
            }
        })).post("/login").send({
            data: {
                name: 1,
                password: 1,
            }
        });
        expect(resp.body).to.have.property('errors')
            .to.have.property('data')
            .to.deep.equal({
                "name": {
                    "reason":"params name value should be string!",
                    "type":"params types"
                },
                "password": {
                    "reason":"params password value should be string!",
                    "type":"params types"
                },
                "datetime": {
                    "reason":"params missing datetime",
                    "type":"params missing"
                }
            });
        expect(resp.status).to.equal(400);
    });
    it ("should response 200 with custom error handler", function *() {
        let resp = yield request(exports._app2(async function (ctx, next) {
            try {
                await next();
            } catch(err) {
                ctx.body = {
                    errors: err.describe
                };
                ctx.status = err.status;
                ctx.app.emit('error', err, ctx);
            }
        })).post("/login").send({
            data: {
                name: '1',
                password: '1',
                datetime: '2017-01-02 22:00:00',
            }
        });
        expect(resp.body).to.have.property('data')
            .to.deep.equal({
                "name": '1',
                "password": '1',
                "datetime": '2017-01-02 22:00:00'
            });

        expect(resp.status).to.equal(200);
    });

});
