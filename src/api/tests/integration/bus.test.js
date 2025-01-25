const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');
const sinon = require('sinon');
const { some, omitBy, isNil } = require('lodash');
const app = require('../../../index');
const Bus = require('../../models/bus.model');

describe('Bus API', async() => {
    bus = {
        email: 'sousa.dfs@gmail.com',
        password,
        name: 'Daniel Sousa',
    };

    describe('GET /v1/buses', () => {
        it('should load when request is ok', () => {
            return request(app)
                .get('/v1/buses')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(bus)
                .expect(httpStatus.CREATED)
                .then((res) => {
                    expect(res.body).to.include(bus);
                });
        });



    })
    describe('POST /v1/buses', () => {
        it('should create a new bus when request is ok', () => {
            return request(app)
                .post('/v1/buses')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(bus)
                .expect(httpStatus.CREATED)
                .then((res) => {
                    expect(res.body).to.include(bus);
                });
        });



    })
})
