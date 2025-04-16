/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');
const sinon = require('sinon');
const { some, omitBy, isNil } = require('lodash');
const app = require('../../../index');
const Location = require('../../models/location.model');
const JWT_EXPIRATION = require('../../../config/vars').jwtExpirationInterval;



describe('Location API', async() => {

    location = {
        email: 'sousa.dfs@gmail.com',
        password,
        name: 'Daniel Sousa',
    };

    describe('POST /v1/locations', () => {
        it('should create a new location when request is ok', () => {
            return request(app)
                .post('/v1/locationss')
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send(location)
                .expect(httpStatus.CREATED)
                .then((res) => {
                    expect(res.body).to.include(location);
                });
        });



    })
})
