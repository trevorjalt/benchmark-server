
const WorkoutService = {
    getAllWorkouts(db) {
        return db
            .from('benchmark_workout AS work')
            .select(
                'work.id',
                'work.date_created',
                'work.user_id',
            )
    },

    getById(db, id) {
        return db
            .from('benchmark_workout AS work')
            .select(
                'work.id',
                'work.date_created',
                'work.user_id'
            )
            .where('work.id', id)
            .first()
    },

    serializeWorkout(workout) {
        return {
            id: workout.id,
            date_created: workout.date_created,
            user_id: workout.user_id
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