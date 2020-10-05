const express = require('express')
const path = require('path')
const SetService = require('./set-service')
const { requireAuth } = require('../middleware/jwt-auth')


const setRouter = express.Router()
const jsonBodyParser = express.json()

setRouter
    .route('/')
    .get(requireAuth, getSets)
    .post(requireAuth, jsonBodyParser, createSet)

setRouter
.route('/:set_id')
.get(requireAuth, checkSetExists, getSelectedSet)
.delete(requireAuth, checkSetExists, deleteSelectedSet)
.patch(requireAuth, checkSetExists, jsonBodyParser, updateSelectedSet)

async function getSets(req, res, next) {
    try {
        const sets = await SetService.getAllSets(req.app.get('db'))

        res.sets = await res.json(sets.map(SetService.serializeSet))

        next()
    } catch (error) {
        next (error)
    }
}

async function createSet(req, res, next) {
    try {
        const { exercise_id, set_weight, set_repetition } = req.body
        const newSet = { exercise_id, set_weight, set_repetition }

        for (const [key, value] of Object.entries(newSet))
            if (value == null)
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body`}
            })

        newSet.user_id = req.user.id

        const set = await SetService.insertSet(
            req.app.get('db'),
            newSet
        )

        await res
            .status(201)
            .location(path.posix.join(req.originalUrl, `/${set.id}`))
            .json(SetService.serializeSet(set))

        next()
    } catch(error) {
        next(error)
    }
}

async function checkSetExists(req, res, next) {
    try {
        
        const expectedSet = await SetService.getById(
            req.app.get('db'),
            req.params.set_id
        )

        if(!expectedSet)
            return await res.status(404).json({
                error: { message:`Set not found` }
            })

        res.expectedSet = expectedSet
        
        next()
    } catch (error) {
        next(error)
    }
}

async function getSelectedSet(req, res, next) {
    try {
        await res.json(SetService.serializeSet(res.expectedSet))

        next()
    } catch (error) {
        next(error)
    }
}

async function deleteSelectedSet(req, res, next) {
    try {
        await SetService.deleteSet(
            req.app.get('db'),
            req.params.set_id
        )

        await res.status(204).end()

        next()
    } catch {}
        next()
}

async function updateSelectedSet(req, res, next) {
    try {
        const { set_weight, set_repetition, date_modified } = req.body
        const setToUpdate = { set_weight, set_repetition, date_modified }

        const numberOfValues = Object.values(setToUpdate).filter(Boolean).length
        if (numberOfValues === 0)
            return await res.status(400).json({
                error: { message: `Invalid request`}
        })

        await SetService.updateSet(
            req.app.get('db'),
            req.params.set_id,
            setToUpdate
        )

        await res.status(204).end()

        next()
    } catch (error) {
        next(error)
    }
}

module.exports = setRouter