const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const supertest = require('supertest')
const { expect } = require('chai')

describe('Exercise Endpoints', function() {
    let db

    const { testUsers, testWorkouts, testExercises } = helpers.makeWorkoutsFixtures()
    // const testUser = testUsers[0]

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

    describe(`GET /api/exercise`, () => {
        context(`Given no exercises in the database`, () => {
            beforeEach('insert users', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                )
            )

            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/exercise')
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, [])
            })
        })

        context(`Given there are exercises in the database`, () => {
            beforeEach('insert workouts', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                    testExercises,
                )
            )

            it(`responds with 200 and all the exercises`, () => {
                const expectedExercises = testExercises.map(exercise =>
                    helpers.makeExpectedExercise(exercise)
                )
                return supertest(app)
                        .get('/api/exercise')
                        .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                        .expect(200, expectedExercises)
            })
        })
    })

    describe(`POST /api/exercise`, () => {
        beforeEach('insert workouts', () =>
            helpers.seedBenchmarkTables(
                db,
                testUsers,
                testWorkouts,
            )
        )

        it(`creates an exercise, responding with 201 and the new exercise`, function() {
            this.retries(3)
            const testWorkout = testWorkouts[0]
            const testUser = testUsers[0]
            const newExercise = {
                exercise_name: 'test-exercise',
                workout_id: testWorkout.id,
            }
            return supertest(app)
                .post('/api/exercise')
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .send(newExercise)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.user_id).to.eql(testUser.id)
                    expect(res.body.exercise_name).to.eql(newExercise.exercise_name)
                    expect(res.body.workout_id).to.eql(newExercise.workout_id)
                    expect(res.headers.location).to.eql(`/api/exercise/${res.body.id}`)
                    const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                    const actualDate = new Date(res.body.date_created).toLocaleString()
                    expect(actualDate).to.eql(expectedDate)
                })
                .expect(res =>
                    db
                    .from('benchmark_exercise')
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

        context(`Given an XSS attack exercise`, () => {
            const testUser = testUsers[0]
            const testWorkout = testWorkouts[0]
            const {
                maliciousExercise,
                expectedExercise,
            } = helpers.makeMaliciousExercise(testUser, testWorkout)
      
            beforeEach('insert malicious exercise', () => {
                return helpers.seedMaliciousExercise(
                    db,
                    // testUser,
                    maliciousExercise,
                )
            })
      
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/exercise/${maliciousExercise.id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(200)
                    .expect(res => {
                    expect(res.body.exercise_name).to.eql(expectedExercise.exercise_name)
                    })
            })
        })
    })

    describe(`GET /api/exercise/:exercise_id`, () => {
        context(`Given no exercises in the database`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
      
            it(`responds with 404`, () => {
                const exerciseId = 123456
                return supertest(app)
                    .get(`/api/exercise/${exerciseId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Exercise not found` }})
            })
        })

        context('Given there are exercises in the database', () => {
            beforeEach('insert workouts', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                    testExercises,
                )
            )
      
            it('responds with 200 and the specified exercise', () => {
                const exerciseId = 2
                
                const expectedExercise = helpers.makeExpectedExercise( 
                    testExercises[exerciseId - 1],
                )
      
                return supertest(app)
                    .get(`/api/exercise/${exerciseId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedExercise)
            })
        })

    })
})
