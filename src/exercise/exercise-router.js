const express = require('express')
const path = require('path')
const ExerciseService = require('./exercise-service')
const { requireAuth } = require('../middleware/jwt-auth')


const exerciseRouter = express.Router()
const jsonBodyParser = express.json()

exerciseRouter
    .route('/')
    .get(requireAuth, getExercises)
    .post(requireAuth, jsonBodyParser, createExercise)


exerciseRouter
    .route('/:exercise_id')
    .get(requireAuth, checkExerciseExists, getSelectedExercise)
    .delete(requireAuth, checkExerciseExists, deleteSelectedExercise)
    .patch(requireAuth, checkExerciseExists, jsonBodyParser, updateSelectedExercise)

async function getExercises(req, res, next) {
    try {
        const exercises = await ExerciseService.getAllExercises(req.app.get('db'))

        res.exercises = await res.json(exercises.map(ExerciseService.serializeExercise))

        next()
    } catch (error) {
        next (error)
    }
}

async function createExercise(req, res, next) {
    try {
        const { workout_id, exercise_name } = req.body
        const newExercise = { workout_id, exercise_name }

        for (const [key, value] of Object.entries(newExercise))
            if (value == null)
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body`}
            })

        newExercise.user_id = req.user.id

        const exercise = await ExerciseService.insertExercise(
            req.app.get('db'),
            newExercise
        )

        await res
            .status(201)
            .location(path.posix.join(req.originalUrl, `/${exercise.id}`))
            .json(ExerciseService.serializeExercise(exercise))

        next()
    } catch(error) {
        next(error)
    }
}

async function checkExerciseExists(req, res, next) {
    try {
        const exercise = await ExerciseService.getById(
            req.app.get('db'),
            req.params.exercise_id
        )

        if(!exercise)
            return await res.status(404).json({
                error: { message:`Exercise not found` }
            })

        res.exercise = exercise

        next()
    } catch (error) {
        next(error)
    }
}

async function getSelectedExercise(req, res, next) {
    try {
        await res.json(ExerciseService.serializeExercise(res.exercise))

        next()
    } catch (error) {
        next(error)
    }
}

async function deleteSelectedExercise(req, res, next) {
    try {
        await ExerciseService.deleteExercise(
            req.app.get('db'),
            req.params.exercise_id
        )

        await res.status(204).end()

        next()
    } catch {}
        next()
}

async function updateSelectedExercise(req, res, next) {
    try {
        const { exercise_name, date_modified } = req.body
        const exerciseToUpdate = { exercise_name, date_modified }

        const numberOfValues = Object.values(exerciseToUpdate).filter(Boolean).length
        if (numberOfValues === 0)
            return await res.status(400).json({
                error: { message: `Invalid request`}
        })

        await ExerciseService.updateExercise(
            req.app.get('db'),
            req.params.exercise_id,
            exerciseToUpdate
        )

        await res.status(204).end()

        next()
    } catch (error) {
        next(error)
    }
}

module.exports = exerciseRouter