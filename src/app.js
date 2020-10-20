const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const authRouter = require('./auth/auth-router')
const userRouter = require('./user/user-router')
const workoutRouter = require('./workout/workout-router')
const exerciseRouter = require('./exercise/exercise-router')
const setRouter = require ('./set/set-router')

const app = express();


app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
    skip: () => NODE_ENV === 'test',
}))
app.use(cors())
app.use(helmet())

app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/api/workout', workoutRouter)
app.use('/api/exercise', exerciseRouter)
app.use('/api/set', setRouter)

app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } };
    } else {
        console.error(error)
        response = { message: error.message, error };
    }
    res.status(500).json(response);
})

module.exports = app