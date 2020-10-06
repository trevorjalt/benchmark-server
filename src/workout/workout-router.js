const express = require('express')
const path = require('path')
const WorkoutService = require('./workout-service')
const { requireAuth } = require('../middleware/jwt-auth')

const workoutRouter = express.Router()

workoutRouter
    .route('/')
    .get(requireAuth, getWorkouts)
    .post(requireAuth, createWorkout)

workoutRouter
    .route('/:workout_id')
    .get(requireAuth, checkWorkoutExists, getSelectedWorkout)
    .delete(requireAuth, checkWorkoutExists, deleteSelectedWorkout)
    
async function getWorkouts(req, res, next) {
    try {
        const workouts = await WorkoutService.getUserWorkouts(
            req.app.get('db'),
            req.user.id
        )

        res.workouts = await res.json(workouts.map(WorkoutService.serializeWorkout))
        
        next()
    } catch (error) {
        next(error)
    }
}

async function createWorkout(req, res, next) {
    try {
        const newWorkout = {}

        newWorkout.user_id = req.user.id

        const workout = await WorkoutService.insertWorkout(
            req.app.get('db'),
            newWorkout
        )

        await res
            .status(201)
            .location(path.posix.join(req.originalUrl, `/${workout.id}`))
            .json(WorkoutService.serializeWorkout(workout))
        
        next()
    } catch(error) {
        next(error)
    }
}

async function checkWorkoutExists(req, res, next) {
    try {
        const workout = await WorkoutService.getById(
            req.app.get('db'),
            req.params.workout_id
        )

        if(!workout)
            return await res.status(404).json({
                error: { message:`Workout not found` }
            })

        res.workout = workout

        next()
    } catch (error) {
        next(error)
    }
}

async function getSelectedWorkout(req, res, next) {
    try {
        await res.json(WorkoutService.serializeWorkout(res.workout))

        next()
    } catch (error) {
        next(error)
    }
}

async function deleteSelectedWorkout(req, res, next) {
    try {
        await WorkoutService.deleteWorkout(
            req.app.get('db'),
            req.params.workout_id
        )

        await res.status(204).end()

        next()
    } catch {}
        next()
}

module.exports = workoutRouter