const xss = require('xss')

const SetService = {
    getUserSets(db, id) {
        return db
            .from('benchmark_set AS exercise_set')
            .select(
                'exercise_set.id',
                'exercise_set.set_weight',
                'exercise_set.set_repetition',
                'exercise_set.date_created',
                'exercise_set.exercise_id',
                'exercise_set.user_id',
            )
            .where('exercise_set.user_id', id)
            .orderBy('exercise_set.id', 'asc')
    },

    getById(db, id) {
        return db
            .from('benchmark_set AS exercise_set')
            .select(
                'exercise_set.id',
                'exercise_set.set_weight',
                'exercise_set.set_repetition',
                'exercise_set.date_created',
                'exercise_set.date_modified',
                'exercise_set.exercise_id',
                'exercise_set.user_id',
            )
            .where('exercise_set.id', id)
            .first()
    },

    serializeSet(exercise_set) {
        return {
            id: exercise_set.id,
            set_weight: Number(xss(exercise_set.set_weight)),
            set_repetition: Number(xss(exercise_set.set_repetition)),
            date_created: exercise_set.date_created,
            exercise_id: exercise_set.exercise_id,
            user_id: exercise_set.user_id,
        }
    },

    insertSet(db, newSet) {
        return db
            .insert(newSet)
            .into('benchmark_set')
            .returning('*')
            .then(([set]) => set)
            .then(set =>
                SetService.getById(db, set.id)
            )
    },

    deleteSet(db, id) {
        return db
            .from('benchmark_set')
            .where({ id })
            .delete()
    },

    updateSet(db, id, newSetFields) {
        return db
            .from('benchmark_set')
            .where({ id })
            .update(newSetFields)
    },
}

module.exports = SetService