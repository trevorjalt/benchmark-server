const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Protected endpoints', function() {
  let db

  const {
    testUsers,
    testWorkouts,
    testExercises,
  } = helpers.makeWorkoutsFixtures()

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

  beforeEach('insert articles', () =>
    helpers.seedBenchmarkTables(
      db,
      testUsers,
      testWorkouts,
      testExercises,
    )
  )

  const protectedEndpoints = [
    {
      name: 'GET /api/workout',
      path: '/api/workout',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/workout',
      path: '/api/workout',
      method: supertest(app).post,
    },
    {
      name: 'GET /api/workout/:workout_id',
      path: '/api/workout/1',
      method: supertest(app).get,
    },
    {
      name: 'DELETE /api/workout/:workout_id',
      path: '/api/workout/1',
      method: supertest(app).delete,
    },
    {
      name: 'GET /api/exercise',
      path: '/api/exercise',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/exercise',
      path: '/api/exercise',
      method: supertest(app).post,
    },
    {
      name: 'GET /api/exercise/:exercise_id',
      path: '/api/exercise/1',
      method: supertest(app).get,
    },
    {
      name: 'DELETE /api/exercise/:exercise_id',
      path: '/api/exercise/1',
      method: supertest(app).delete,
    },
    {
      name: 'PATCH /api/exercise/:exercise_id',
      path: '/api/exercise/1',
      method: supertest(app).patch,
    },
    {
      name: 'GET /api/set',
      path: '/api/set',
      method: supertest(app).get,
    },
    {
      name: 'POST /api/set',
      path: '/api/set',
      method: supertest(app).post,
    },
    {
      name: 'GET /api/set/:set_id',
      path: '/api/set/1',
      method: supertest(app).get,
    },
    {
      name: 'DELETE /api/set/:set_id',
      path: '/api/set/1',
      method: supertest(app).delete,
    },
    {
      name: 'PATCH /api/set/:set_id',
      path: '/api/set/1',
      method: supertest(app).patch,
    },
    {
      name: 'POST /api/auth/refresh',
      path: '/api/auth/refresh',
      method: supertest(app).post,
    },
  ]

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it(`responds 401 'Missing bearer token' when no bearer token`, () => {
        return endpoint.method(endpoint.path)
          .expect(401, { error: `Missing bearer token` })
      })

      it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
        const validUser = testUsers[0]
        const invalidSecret = 'bad-secret'
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
          .expect(401, { error: `Unauthorized request` })
      })

      it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
        const invalidUser = { username: 'user-not-existy', id: 1 }
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: `Unauthorized request` })
      })
    })
  })
})