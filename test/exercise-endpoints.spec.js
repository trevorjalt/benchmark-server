const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const supertest = require('supertest')
const { expect } = require('chai')

describe('Exercise Endpoints', function() {
    let db

    const { testUsers, testWorkouts, testExercises } = helpers.makeWorkoutsFixtures()
    const testUser = testUsers[0]
    const testWorkout = testWorkouts[0]

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
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(200, [])
            })
        })

        context(`Given there are exercises in the database`, () => {
            beforeEach('insert exercises', () =>
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
                        .set('Authorization', helpers.makeAuthHeader(testUser))
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
            const newExercise = {
                exercise_name: 'test-exercise',
                workout_id: testWorkout.id,
            }
            return supertest(app)
                .post('/api/exercise')
                .set('Authorization', helpers.makeAuthHeader(testUser))
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
            const {
                maliciousExercise,
                expectedExercise,
            } = helpers.makeMaliciousExercise(testUser, testWorkout)
      
            beforeEach('insert malicious exercise', () => {
                return helpers.seedMaliciousExercise(
                    db,
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
                    .set('Authorization', helpers.makeAuthHeader(testUser))
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
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(200, expectedExercise)
            })
        })
    })

    describe(`DELETE /api/exercise/:exercise_id`, () => {
        context(`Given no exercises in the database`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
            it(`responds with 404 'Exercise not found'`, () => {
                const exerciseId = 123456
                return supertest(app)
                .delete(`/api/exercise/${exerciseId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(404, { error: { message: `Exercise not found` } })
            })
        })
    
        context('Given there are exercises in the database', () => {
            beforeEach('insert exercises', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                    testExercises,
                )
            )
        
            it('responds with 204 and removes the selected exercise', () => {
                const idToRemove = 2
                const expectedExercises = testExercises.filter(exercise => exercise.id !== idToRemove)
                return supertest(app)
                .delete(`/api/exercise/${idToRemove}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(204)
                .then(res =>
                    supertest(app)
                    .get(`/api/exercise`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(expectedExercises)
                )
            })
        })
    })

    describe(`PATCH /api/exercise/:exercise_id`, () => {
        context(`Given no exercises in the database`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
          
            it(`responds with 404`, () => {
                const exerciseId = 123456
                return supertest(app)
                    .delete(`/api/exercise/${exerciseId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(404, { error: { message: `Exercise not found` } })
            })
        })
    
        context('Given there are exercises in the database', () => {
            beforeEach('insert exercises', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                    testExercises,
                )
            )
    
            it('responds with 204 and updates the exercise', () => {
                const idToUpdate = 2
                const updateExercise = {
                    exercise_name: 'updated exercise name',
                }
                const expectedExercise = {
                    ...testExercises[idToUpdate - 1],
                    ...updateExercise
                }
                return supertest(app)
                    .patch(`/api/exercise/${idToUpdate}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send(updateExercise)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/exercise/${idToUpdate}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .expect(expectedExercise)
                    )
            })
    
            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/exercise/${idToUpdate}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: { message: `Invalid request`}
                    })
            })
    
            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateExercise = {
                    exercise_name: 'test-exercise-name',
                }
                const expectedExercise = {
                    ...testExercises[idToUpdate - 1],
                    ...updateExercise
                }
        
                return supertest(app)
                    .patch(`/api/exercise/${idToUpdate}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send({
                        ...updateExercise,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/exercise/${idToUpdate}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .expect(expectedExercise)
                    )
            })
        })
    })
})