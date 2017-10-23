'use strict';

const expose = Object.assign;
const models = require('./models');

const koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const app = new koa();

const schema = require('./index');

const _json = schema._json;

const router = require('koa-router')();

const payload = require('./_params-schema');

router.post('/login', schema('request', payload,
    async function(ctx, next) {
        console.log(ctx[_json]);
    }
));

app.use(router.routes());

module.exports = {
    expose,
    context: {
        app,
    }
};
