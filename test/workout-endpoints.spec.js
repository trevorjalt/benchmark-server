const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const supertest = require('supertest')

describe('Workout Endpoints', function() {
    let db

    const { testUsers, testWorkouts } = helpers.makeWorkoutsFixtures()
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

    describe(`GET /api/workout`, () => {
        context(`Given no workouts in the database`, () => {
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
                    helpers.makeExpectedWorkout(workout)
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
            const testUser = testUsers[0]
            const newWorkout = {}
            return supertest(app)
                .post('/api/workout')
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .send(newWorkout)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.user_id).to.eql(testUser.id)
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
        
    
    describe(`GET /api/workout/:workout_id`, () => {
        context(`Given no workouts in the database`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
      
            it(`responds with 404`, () => {
                const workoutId = 123456
                return supertest(app)
                    .get(`/api/workout/${workoutId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Workout not found` }})
            })
        })
      
        context('Given there are workouts in the database', () => {
            beforeEach('insert workouts', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                )
            )
      
            it('responds with 200 and the specified workout', () => {
                const workoutId = 2
                
                const expectedWorkout = helpers.makeExpectedWorkout( 
                    testWorkouts[workoutId - 1],
                )
      
                return supertest(app)
                    .get(`/api/workout/${workoutId}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedWorkout)
            })
        })
    })

    describe(`DELETE /api/workout/:workout_id`, () => {
        context(`Given no workouts in the database`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )
            it(`responds with 404 'Workout not found'`, () => {
                const workoutId = 123456
                return supertest(app)
                .delete(`/api/workout/${workoutId}`)
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .expect(404, { error: { message: `Workout not found` } })
            })
        })
    
        context('Given there are workouts in the database', () => {
            beforeEach('insert workouts', () =>
                helpers.seedBenchmarkTables(
                    db,
                    testUsers,
                    testWorkouts,
                )
            )
        
            it('responds with 204 and removes the selected workout', () => {
                const idToRemove = 2
                const expectedWorkouts = testWorkouts.filter(workout => workout.id !== idToRemove)
                return supertest(app)
                .delete(`/api/workout/${idToRemove}`)
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .expect(204)
                .then(res =>
                    supertest(app)
                    .get(`/api/workout`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(expectedWorkouts)
                )
            })
        })
    })

})

