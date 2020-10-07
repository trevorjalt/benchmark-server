const xss = require('xss')

const ExerciseService = {
    getUserExercises(db, id) {
        return db
            .from('benchmark_exercise AS exercise')
            .select(
                'exercise.id',
                'exercise.exercise_name',
                'exercise.date_created',
                'exercise.date_modified',
                'exercise.workout_id',
                'exercise.user_id',
            )
            .where('exercise.user_id', id)
            .orderBy('exercise.id', 'asc')
    },

    getById(db, id) {
        return db
            .from('benchmark_exercise AS exercise')
            .select(
                'exercise.id',
                'exercise.exercise_name',
                'exercise.date_created',
                'exercise.date_modified',
                'exercise.workout_id',
                'exercise.user_id',
            )
            .where('exercise.id', id)
            .first()
    },

    serializeExercise(exercise) {
        return {
            id: exercise.id,
            exercise_name: xss(exercise.exercise_name),
            date_created: exercise.date_created,
            // date_modified: exercise.date_modified,
            workout_id: exercise.workout_id,
            user_id: exercise.user_id,
        }
    },

    insertExercise(db, newExercise) {
        return db
            .insert(newExercise)
            .into('benchmark_exercise')
            .returning('*')
            .then(([exercise]) => exercise)
            .then(exercise =>
                ExerciseService.getById(db, exercise.id)
            )
    },

    deleteExercise(db, id) {
        return db
            .from('benchmark_exercise')
            .where({ id })
            .delete()
    },

    updateExercise(db, id, newExerciseFields) {
        return db
            .from('benchmark_exercise')
            .where({ id })
            .update(newExerciseFields)
    },
}

module.exports = ExerciseService