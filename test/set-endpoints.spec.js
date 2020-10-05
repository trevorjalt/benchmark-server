const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const supertest = require('supertest')
const { expect } = require('chai')

describe('Set Endpoints', function() {
    let db

    const { testUsers, testWorkouts, testExercises, testSets } = helpers.makeWorkoutsFixtures()
    const testUser = testUsers[0]
    const testWorkout = testWorkouts[0]
    const testExercise = testExercises[0]

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

    describe(`GET /api/set`, () => {
        context(`Given no sets in the database`, () => {
            beforeEach('insert users', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                )
            )

            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/set')
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(200, [])
            })
        })

        context(`Given there are sets in the database`, () => {
            beforeEach('insert sets', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                    testExercises,
                    testSets,
                )
            )

            it(`responds with 200 and all the sets`, () => {
                const expectedSets = testSets.map(exercise_set =>
                    helpers.makeExpectedSet(exercise_set)
                )
                return supertest(app)
                        .get('/api/set')
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .expect(200, expectedSets)
            })
        })
    })

    describe(`POST /api/set`, () => {
        beforeEach('insert workouts', () =>
            helpers.seedBenchmarkTables(
                db,
                testUsers,
                testWorkouts,
                testExercises
            )
        )

        it(`creates a set, responding with 201 and the new set`, function() {
            this.retries(3)
            const newExerciseSet = {
                set_weight: 200,
                set_repetition: 5,
                exercise_id: testExercise.id,
            }
            return supertest(app)
                .post('/api/set')
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .send(newExerciseSet)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.user_id).to.eql(testUser.id)
                    expect(res.body.set_weight).to.eql(newExerciseSet.set_weight)
                    expect(res.body.set_repetition).to.eql(newExerciseSet.set_repetition)
                    expect(res.body.exercise_id).to.eql(newExerciseSet.exercise_id)
                    expect(res.headers.location).to.eql(`/api/set/${res.body.id}`)
                    const expectedDate = new Date().toLocaleString('en', { timeZone: 'UTC' })
                    const actualDate = new Date(res.body.date_created).toLocaleString()
                    expect(actualDate).to.eql(expectedDate)
                })
                .expect(res =>
                    db
                    .from('benchmark_set')
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

    describe(`GET /api/set/:set_id`, () => {
        context(`Given no sets in the database`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
      
            it(`responds with 404`, () => {
                const exerciseSetId = 123456
                return supertest(app)
                    .get(`/api/set/${exerciseSetId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(404, { error: { message: `Exercise set not found` }})
            })
        })

        context('Given there are sets in the database', () => {
            beforeEach('insert workouts', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                    testExercises,
                    testSets,
                )
            )
      
            it('responds with 200 and the specified set', () => {
                const exerciseSetId = 2
                
                const expectedExerciseSet = helpers.makeExpectedSet( 
                    testSets[exerciseSetId - 1],
                )
      
                return supertest(app)
                    .get(`/api/set/${exerciseSetId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(200, expectedExerciseSet)
            })
        })
    })

    describe(`DELETE /api/set/:set_id`, () => {
        context(`Given no sets in the database`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
            it(`responds with 404 'Exercise set not found'`, () => {
                const exerciseSetId = 123456
                return supertest(app)
                .delete(`/api/set/${exerciseSetId}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(404, { error: { message: `Exercise set not found` } })
            })
        })
    
        context('Given there are sets in the database', () => {
            beforeEach('insert sets', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                    testExercises,
                    testSets,
                )
            )
        
            it('responds with 204 and removes the selected set', () => {
                const idToRemove = 2
                const expectedSets = testSets.filter(exercise_set => exercise_set.id !== idToRemove)
                return supertest(app)
                .delete(`/api/set/${idToRemove}`)
                .set('Authorization', helpers.makeAuthHeader(testUser))
                .expect(204)
                .then(res =>
                    supertest(app)
                    .get(`/api/set`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(expectedSets)
                )
            })
        })
    })

    describe(`PATCH /api/set/:set_id`, () => {
        context(`Given no sets in the database`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
          
            it(`responds with 404`, () => {
                const exerciseSetId = 123456
                return supertest(app)
                    .delete(`/api/set/${exerciseSetId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .expect(404, { error: { message: `Exercise set not found` } })
            })
        })
    
        context('Given there are sets in the database', () => {
            beforeEach('insert sets', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                    testExercises,
                    testSets,
                )
            )
    
            it('responds with 204 and updates the set', () => {
                const idToUpdate = 2
                const updateSet = {
                    set_weight: 1234,
                    set_repetition: 1234,
                }
                const expectedSet = {
                    ...testSets[idToUpdate - 1],
                    ...updateSet
                }
                return supertest(app)
                    .patch(`/api/set/${idToUpdate}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send(updateSet)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/set/${idToUpdate}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .expect(expectedSet)
                    )
            })
    
            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/set/${idToUpdate}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: { message: `Invalid request`}
                    })
            })
    
            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateSet = {
                    set_weight: 1234,
                    set_repetition: 1234,
                }
                const expectedSet = {
                    ...testSets[idToUpdate - 1],
                    ...updateSet
                }
        
                return supertest(app)
                    .patch(`/api/set/${idToUpdate}`)
                    .set('Authorization', helpers.makeAuthHeader(testUser))
                    .send({
                        ...updateSet,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/set/${idToUpdate}`)
                        .set('Authorization', helpers.makeAuthHeader(testUser))
                        .expect(expectedSet)
                    )
            })
        })
    })
})