
const WorkoutService = {
    getUserWorkouts(db, id) {
        return db
            .from('benchmark_workout AS work')
            .select(
                'work.id',
                'work.date_created',
                'work.user_id',
            )
            .where('work.user_id', id)
            
            // .select ('*')
            // .from('benchmark_workout')
            // .select('*')
            // .from('benchmark_exercise')
            // .where('benchmark_exercise.workout_id', 1)

            // .from('benchmark_user AS user')
            // .select('id')
            // .join('benchmark_workout AS workout')
            

            // .from('benchmark_workout AS work')
            // .from('benchmark_workout')
            // .select(
            //     'benchmark_workout.id',
            //     'benchmark_workout.date_created',
            //     'benchmark_workout.user_id',
            //     db.raw(
            //         `json_strip_nulls(
            //             json_build_object(
            //                 'id', benchmark_exercise.id,
            //                 'exercise_name', benchmark_exercise.exercise_name,
            //                 'date_created', benchmark_exercise.date_created,
            //                 'workout_id', benchmark_exercise.workout_id,
            //             )
            //         )`
            //     ),
            // )
            // .leftJoin('benchmark_exercise', 'benchmark_workout.id', 'benchmark_exercise.workout_id',)
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