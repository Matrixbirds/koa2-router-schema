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
    });
});

function request(app) {
  return supertest(app.listen());
}
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
