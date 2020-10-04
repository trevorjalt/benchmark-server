const knex = require('knex')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const helpers = require('./test-helpers')
const supertest = require('supertest')

describe.only('Auth Endpoints', function() {
    let db

    const { testUsers, testWorkouts } = helpers.makeWorkoutsFixtures()
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

    describe(`GET /api/workout`, () => {
        context(`Given no workouts`, () => {
            beforeEach('insert users', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                )
            )
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/workout')
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, [])
            })
        })

        context(`Given there are workouts in the database`, () => {
            beforeEach('insert workouts', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                )
            )

            it(`responds with 200 and all the workouts`, () => {
                const expectedWorkouts = testWorkouts.map(workout =>
                    helpers.makeExpectedWorkout(
                        workout
                    )
                )
                return supertest(app)
                        .get('/api/workout')
                        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                        .expect(200, expectedWorkouts)
            })
        })
    })

    describe(`POST /api/workout`, () => {
        beforeEach('insert users', () =>
            helpers.seedUsers(
                db,
                testUsers,
            )
        )

        it(`creates a workout, responding with 201 and the new workout`, function() {
            this.retries(3)
            const testWorkout = testWorkouts[0]
            const testUser = testUsers[0]
            const newWorkout = {
                date_created: new Date(),
            }
            return supertest(app)
                .post('/api/workout')
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .send(newWorkout)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    // expect(res.body.user.id).to.eql(testUser.id)
                    expect(res.headers.location).to.eql(`/api/workout/${res.body.id}`)
                    const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                    const actualDate = new Date(res.body.date_created).toLocaleString()
                    expect(actualDate).to.eql(expectedDate)
                })
                .expect(res =>
                    db
                    .from('benchmark_workout')
                    .select('*')
                    .where({ id: res.body.id })
                    .first()
                    .then(row => {
                        expect(row.user_id).to.eql(testUser.id)
                        const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                        const actualDate = new Date(row.date_created).toLocaleString()
                        expect(actualDate).to.eql(expectedDate)
                    })
                )
          })

        

    })

})