'use strict';

const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const lib = require('index');
const schema = lib.schema;
const payload = require("_params-schema");

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
                    password: string!
                };
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
            console.log('result', result);
        });
    });
});

describe.skip("POST /login", function () {
    context("invalid request params", function () {
        it ("should response 400", function *() {
        })
    });

    context("valid request params", function () {
        it ("should response 200", function *() {
        });
    })
})
