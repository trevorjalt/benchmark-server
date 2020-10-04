const xss = require('xss')
const userRouter = require('../user/user-router')

const WorkoutService = {
    getAllWorkouts(db) {
        return db
            .from('benchmark_workout AS work')
            .select(
                'work.id',
                'work.date_created'
            )
            .leftJoin(
                'benchmark_user AS usr',
                'work.user_id',
                'usr.id',
            )
    },

    getById(db, id) {
        return db
            .from('benchmark_workout AS work')
            .select(
                'work.id',
                'work.date_created'
            )
            .where('work.id', id)
            .first()
    },

    serializeWorkout(workout) {
        return {
            id: workout.id,
            date_created: new Date(workout.date_created),
        }
    },

    insertWorkout(db, newWorkout) {
        return db
            .insert(newWorkout)
            .into('benchmark_workout')
            .returning('*')
            .then(([workout]) => workout)
            .then(workout =>
                WorkoutService.getById(db, workout.id)
            )
    },

    deleteWorkout(db, id) {
        return db
            .from('benchmark_workout')
            .where({ id })
            .delete()
    }
}

module.exports = WorkoutService