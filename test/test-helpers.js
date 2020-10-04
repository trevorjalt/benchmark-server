const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeUsersArray() {
    return [
        {
            id: 1,
            username: 'test-user-1',
            user_password: 'password',
            email: 'email@email.com',
            nickname: 'TU1',
            date_created: new Date(),
        },
        {
            id: 2,
            username: 'test-user-2',
            user_password: 'password',
            email: 'email2@email.com',
            nickname: 'TU2',
            date_created: new Date(),
        },
        {
            id: 3,
            username: 'test-user-3',
            user_password: 'password',
            email: 'email3@email.com',
            nickname: 'TU2',
            date_created: new Date(),
        }
    ]
}

function makeWorkoutsArray(users) {
    return [
        {
            id: 1,
            date_created: new Date(),
            user_id: users[0].id
        },
        {
            id: 2,
            date_created: new Date(),
            user_id: users[0].id
        },
        {
            id: 3,
            date_created: new Date(),
            user_id: users[0].id
        },
    ]
}

function makeExercisesArray(users, workouts) {
    return [
        {
            id: 1,
            exercise_name: 'exercise',
            date_created: new Date(),
            workout_id: workouts[0].id,
            user_id: users[0].id
        },
        {
            id: 2,
            exercise_name: 'exercise2',
            date_created: new Date(),
            workout_id: workouts[0].id,
            user_id: users[0].id
        },
        {
            id: 3,
            exercise_name: 'exercise3',
            date_created: new Date(),
            workout_id: workouts[0].id,
            user_id: users[0].id
        },
    ]
}

function makeSetsArray(users, exercises) {
    return [
        {
            id: 1,
            set_weight: 100,
            set_repetition: 8,
            date_created: new Date(),
            exercise_id: exercises[0].id,
            user_id: users[0].id
        },
        {
            id: 2,
            set_weight: 200,
            set_repetition: 5,
            date_created: new Date(),
            exercise_id: exercises[0].id,
            user_id: users[0].id
        },
        {
            id: 3,
            set_weight: 300,
            set_repetition: 3,
            date_created: new Date(),
            exercise_id: exercises[0].id,
            user_id: users[0].id
        },
    ]
}

function makeWorkoutsFixtures() {
    const testUsers = makeUsersArray()
    const testWorkouts = makeWorkoutsArray(testUsers)
    const testExercises = makeExercisesArray(testUsers, testWorkouts)
    const testSets = makeSetsArray(testUsers, testExercises)
    return { testUsers, testWorkouts, testExercises, testSets }
}

function cleanTables(db) {
    return db.transaction(trx =>
        trx.raw(
            `TRUNCATE
                benchmark_user,
                benchmark_workout,
                benchmark_exercise,
                benchmark_set
            `
        )
        .then(() =>
            Promise.all([
                trx.raw(`ALTER SEQUENCE benchmark_user_id_seq minvalue 0 START WITH 1`),
                trx.raw(`ALTER SEQUENCE benchmark_workout_id_seq minvalue 0 START WITH 1`),
                trx.raw(`ALTER SEQUENCE benchmark_exercise_id_seq minvalue 0 START WITH 1`),
                trx.raw(`ALTER SEQUENCE benchmark_set_id_seq minvalue 0 START WITH 1`),
                trx.raw(`SELECT setval('benchmark_user_id_seq', 0)`),
                trx.raw(`SELECT setval('benchmark_workout_id_seq', 0)`),
                trx.raw(`SELECT setval('benchmark_exercise_id_seq', 0)`),
                trx.raw(`SELECT setval('benchmark_set_id_seq', 0)`),
            ])
        )
    )

}

function seedUsers(db, users) {
    const preppedUsers = users.map(user => ({
        ...user,
        user_password: bcrypt.hashSync(user.user_password, 1)
    }))
    return db.into('benchmark_user').insert(preppedUsers)
        .then(() =>
            db.raw(
                `SELECT setval('benchmark_user_id_seq', ?)`,
                [users[users.length - 1].id],
            )
        )
}

function seedBenchmarkTables(db, users, workouts, exercises, sets) {
    // use a transaction to group the queries and auto rollback on any failure
    return db.transaction(async trx => {
      await seedUsers(trx, users)
      await trx.into('benchmark_workout').insert(workouts)
      // update the auto sequence to match the forced id values
      await trx.raw(
        `SELECT setval('benchmark_workout_id_seq', ?)`,
        [workouts[workouts.length - 1].id],
      )
      // only insert comments if there are some, also update the sequence counter
    //   if (comments.length) {
    //     await trx.into('blogful_comments').insert(comments)
    //     await trx.raw(
    //       `SELECT setval('blogful_comments_id_seq', ?)`,
    //       [comments[comments.length - 1].id],
    //     )
    //   }
    })
  }

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
        subject: user.username,
        algorithm: 'HS256',
    })
    return `Bearer ${token}`
}

function makeExpectedWorkout(workout) {
    return {
        id: workout.id,
        date_created: workout.date_created.toISOString(),
        user_id: workout.user_id,
    }
}

module.exports = {
    makeUsersArray,
    makeWorkoutsArray,
    makeExercisesArray,
    makeSetsArray,

    makeWorkoutsFixtures,
    cleanTables,
    seedUsers,
    seedBenchmarkTables,
    makeAuthHeader,
    makeExpectedWorkout,
}