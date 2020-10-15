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
            date_created: new Date().toISOString(),
        },
        {
            id: 2,
            username: 'test-user-2',
            user_password: 'password',
            email: 'email2@email.com',
            nickname: 'TU2',
            date_created: new Date().toISOString(),
        },
        {
            id: 3,
            username: 'test-user-3',
            user_password: 'password',
            email: 'email3@email.com',
            nickname: 'TU2',
            date_created: new Date().toISOString(),
        }
    ]
}

function makeWorkoutsArray(users) {
    return [
        {
            id: 1,
            date_created: new Date().toISOString(),
            user_id: users[0].id
        },
        {
            id: 2,
            date_created: new Date().toISOString(),
            user_id: users[0].id
        },
        {
            id: 3,
            date_created: new Date().toISOString(),
            user_id: users[0].id
        },
    ]
}

function makeExercisesArray(users, workouts) {
    return [
        {
            id: 1,
            exercise_name: 'exercise',
            date_created: new Date().toISOString(),
            workout_id: workouts[0].id,
            user_id: users[0].id
        },
        {
            id: 2,
            exercise_name: 'exercise2',
            date_created: new Date().toISOString(),
            workout_id: workouts[0].id,
            user_id: users[0].id
        },
        {
            id: 3,
            exercise_name: 'exercise3',
            date_created: new Date().toISOString(),
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
            date_created: new Date().toISOString(),
            exercise_id: exercises[0].id,
            user_id: users[0].id
        },
        {
            id: 2,
            set_weight: 200,
            set_repetition: 5,
            date_created: new Date().toISOString(),
            exercise_id: exercises[0].id,
            user_id: users[0].id
        },
        {
            id: 3,
            set_weight: 300,
            set_repetition: 3,
            date_created: new Date().toISOString(),
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
        date_created: workout.date_created,
        user_id: workout.user_id,
    }
}

function makeExpectedExercise(exercise) {
    return {
        id: exercise.id,
        exercise_name: exercise.exercise_name,
        date_created: exercise.date_created,
        workout_id: exercise.workout_id,
        user_id: exercise.user_id,
    }
}

function makeExpectedSet(exercise_set) {
    return {
        id: exercise_set.id,
        set_weight: exercise_set.set_weight,
        set_repetition: exercise_set.set_repetition,
        date_created: exercise_set.date_created,
        exercise_id: exercise_set.exercise_id,
        user_id: exercise_set.user_id,
    }
}

function makeExpectedExerciseUpdate(workout) {
    return {
        exercise_name: workout.exercise_name
    }
}

function makeMaliciousExercise(user, workout) {
    
    const maliciousExercise = {
        id: 911,
        exercise_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        date_created: new Date(),
        workout_id: workout.id,
        user_id: user.id,
    }
    const expectedExercise = {
        ...makeExpectedExercise(maliciousExercise),
        exercise_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    }
    return {
        maliciousExercise,
        expectedExercise,
    }
}

function makeMaliciousExerciseUpdate(user, workout) {

    const maliciousUpdate = {
        exercise_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        workout_id: workout.id,
        user_id: user.id,
    }
    const expectedUpdate = {
        ...makeExpectedExerciseUpdate(maliciousUpdate),
        exercise_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    }
    return {
        maliciousUpdate,
        expectedUpdate,
    }
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

function seedBenchmarkTables(db, users, workouts, exercises, exercise_sets) {
    // use a transaction to group the queries and auto rollback on any failure
    return db.transaction(async trx => {
        await seedUsers(trx, users)
        await trx.into('benchmark_workout').insert(workouts)
        // update the auto sequence to match the forced id values
        await trx.raw(
            `SELECT setval('benchmark_workout_id_seq', ?)`,
            [workouts[workouts.length - 1].id],
        )
        //only insert exercises if there are some, also update the sequence counter
        if (exercises) {
            await trx.into('benchmark_exercise').insert(exercises)
            await trx.raw(
                `SELECT setval('benchmark_exercise_id_seq', ?)`,
                [exercises[exercises.length -1].id],
            )
        }
        //only insert sets if there are some, also update the sequence counter
        if (exercise_sets) {
            await trx.into('benchmark_set').insert(exercise_sets)
            await trx.raw(
                `SELECT setval('benchmark_set_id_seq', ?)`,
                [exercise_sets[exercise_sets.length -1].id],
            )
        }
    })
}

function seedMaliciousExercise(db, exercise) {
    return db
        .into('benchmark_exercise')
        .insert([exercise])
      
}

function seedMaliciousExerciseUpdate (db, update) {
    return db
        .into('benchmark_exercise')
        .update([update])
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

module.exports = {
    makeUsersArray,
    makeWorkoutsArray,
    makeExercisesArray,
    makeSetsArray,
    makeWorkoutsFixtures,
    makeAuthHeader,
    makeExpectedWorkout,
    makeExpectedExercise,
    makeExpectedSet,
    makeExpectedExerciseUpdate,
    makeMaliciousExercise,
    makeMaliciousExerciseUpdate,

    seedUsers,
    seedBenchmarkTables,
    seedMaliciousExercise,
    seedMaliciousExerciseUpdate,
    cleanTables,   
}