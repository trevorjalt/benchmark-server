const knex = require('knex')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const helpers = require('./test-helpers')
const { expect } = require('chai')

describe('Users Endpoints', function() {
    let db

    const { testUsers } = helpers.makeWorkoutsFixtures()
    const testUser = testUsers[0]

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('cleanup', () => helpers.cleanTables(db))

    afterEach('cleanup', () => helpers.cleanTables(db))

    describe(`POST /api/user`, () => {
        context(`User Validation`, () => {
            beforeEach('insert users', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                )
            )
            
            const requiredFields = ['username', 'user_password', 'email']

            requiredFields.forEach(field => {
                const registerAttemptBody = {
                    username: 'test username',
                    user_password: 'test password',
                    email: 'email@email.com',
                    nickname: 'test nickname',
                }

                it(`responds with 400 required error when '${field}' is missing`, () => {
                    delete registerAttemptBody[field]
    
                    return supertest(app)
                        .post('/api/user')
                        .send(registerAttemptBody)
                        .expect(400, {
                            error: `Missing '${field}' in request body`,
                        })
                })
            })

            it(`responds 400 'Password must be longer than 8 characters' when empty password`, () => {
                const userShortPassword = {
                    username: 'test username',
                    user_password: '1234567',
                    email: 'test@test.com',
                }
                return supertest(app)
                    .post('/api/user')
                    .send(userShortPassword)
                    .expect(400, { error: `Password must be longer than 8 characters` })
            })
    
            it(`responds 400 'Password must be less than 72 characters' when long password`, () => {
                const userLongPassword = {
                    username: 'test username',
                    user_password: '*'.repeat(73),
                    email: 'test@test.com',
                }
                return supertest(app)
                    .post('/api/user')
                    .send(userLongPassword)
                    .expect(400, { error: `Password must be less than 72 characters` })
            })
    
            it(`responds 400 error when password starts with spaces`, () => {
                const userPasswordStartsSpaces = {
                    username: 'test username',
                    user_password: ' 1Aa!2Bb@',
                    email: 'test@test.com',
                }
                return supertest(app)
                    .post('/api/user')
                    .send(userPasswordStartsSpaces)
                    .expect(400, { error: `Password must not start or end with empty spaces` })
            })
    
            it(`responds 400 error when password ends with spaces`, () => {
                const userPasswordEndsSpaces = {
                    username: 'test username',
                    user_password: '1Aa!2Bb@ ',
                    email: 'test@test.com',
                }
                return supertest(app)
                    .post('/api/user')
                    .send(userPasswordEndsSpaces)
                    .expect(400, { error: `Password must not start or end with empty spaces` })
            })
    
            it(`responds 400 error when password isn't complex enough`, () => {
                const userPasswordNotComplex = {
                    username: 'test username',
                    user_password: '11AAaabb',
                    email: 'test@test.com',
                }
                return supertest(app)
                    .post('/api/user')
                    .send(userPasswordNotComplex)
                    .expect(400, { error: `Password must contain 1 upper case, lower case, number and special character` })
            })
    
            it(`responds 400 'Username already taken' when username isn't unique`, () => {
                const duplicateUser = {
                    username: testUser.username,
                    user_password: '11AAaa!!',
                    email: 'test@test.com',
                }
                return supertest(app)
                    .post('/api/user')
                    .send(duplicateUser)
                    .expect(400, { error: `Username already taken` })
            })

            it(`responds 400 'Email is already associated with an user account' when email isn't unique`, () => {
                const duplicateUser = {
                    username: 'test username',
                    user_password: '11AAaa!!',
                    email: testUser.email,
                }
                return supertest(app)
                    .post('/api/user')
                    .send(duplicateUser)
                    .expect(400, { error: `Email is already associated with an user account` })
            })
        })
    })
})