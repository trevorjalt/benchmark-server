# benchMark Api

Strength-training tracking designed with the user in mind.  Create, update, and review workouts in real time - with the user remaining in the driver seat for the control of their data.

`benchMark Api` is the backend for `benchMark`.  To see `benchMark` in action, check out [benchMark](https://benchmark-live.vercel.app/ "benchMark").

The `benchMark` frontend can be found at: [benchMark-client](https://github.com/trevorjalt/benchmark-client/ "benchMark Client")

## ready to break some limits?

Here at `benchmark` we are strength-training enthusiasts. We understand the amount of stuff you carry at the gym as you work to break your limits. So we're here to help. `benchMark` is an easy solution allowing you to leave that pen and paper at home, and quickly log and track your workout progress in the same device that plays those tunes to keep you pumped up.

## table of contents.

* [the tech](#the-tech)
  * [backend](#backend)
  * [production](#production)
* [setup](#setup)
  * [requirements](#requirements)
  * [local setup](#local-setup)
* [quick start](#quick-start-scripts)
* [endpoints](#endpoints)
  * [overview](#overview)
  * [authentication](#authentication)
  * [public endpoints](#public-endpoints)
    * [/api/user/](#apiuser)
    * [/api/auth/login](#apiauthlogin)
  * [protected endpoints](#protected-endpoints)
    * [/api/user/:user_id](#apiuseruser_id)
    * [/api/auth/refresh](#apiauthrefresh)

 
## the tech.

### backend.

* Node and Express
  * Authentication via JWT
  * RESTful Api
* Testing
  * Supertest (integration)
  * Mocha and Chai (unit)
* Database
  * Postgres
  * Knex.js - SQL wrapper

### production.

Deployed via Heroku

## setup.

### requirements.
* Postgres v8.3.3
* Node v12.18.3

### local setup.

Clone this repository to your local machine 

````
git clone https://github.com/trevorjalt/benchmark-server benchmark-server
````

Change directory into the cloned repository

````
cd benchmark-server
````

Make a fresh start of the git history for this project

```` 
rm -rf .git && git init
````

Install the node dependencies 

````
npm install
````

Create the development user

````
createuser -Pw --interactive 
````

Type `kakarot` for the name of the `role` to add

Select `y` when asked if the user should be a super user

Press `return` (enter) for no password

Create the development databases

````
createdb -U kakarot -d benchmark && createdb -U kakarot -d benchmark-test
````

Create a `.env` file in the project root, and include the following:

````
NODE_ENV=development
PORT=8000
DB_URL=postgresql://kakarot@localhost/benchmark
TEST_DB_URL=postgresql://kakarot@localhost/benchmark-test
````

Start the Postgres server

````
pg_ctl start
````

Run the migrations for the development database

````
npm run migrate
````

Run the migrations for the development test database

````
npm run migrate:test
````

Seed the development database

````
psql -U kakarot -d benchmark -f ./seeds/seed.benchmark_tables.sql
````

## quick start scripts.

Run the benchmark tests

````
npm t
````

Start the application

````
npm start
````

Start nodemon for the application 

````
npm run dev
````

## endpoints.

### overview.

* endpoints
  * /api/auth 
  * /api/user
  * /api/workout 
  * /api/exercise
  * /api/set

### authentication.

benchMark is supported by JWT authentication. A valid `username` and `user_password` must be posted to the [/api/auth/login/](#apiauthlogin) endpoint.  This will return a bearer token that must be included in the header for all protected endpoints.  To create a valid user, see [/api/user/](#apiuser)

### public endpoints.

#### /api/user/

* `POST`

request body requires:

````
{
  username: '',
  user_password: '',
  email: ''
}
````

`request body` supports an optional:

````
{
  nickname: ''
}
````

#### /api/auth/login

* `POST`

`request body` requires:

````
{
  username: '',
  user_password: '',
}
````

### protected endpoints.

#### /api/user/:user_id

* `GET`

`Header` must include a `JWT Token`

#### /api/auth/refresh

* `POST`

`Header` must include a `JWT Token`



## set your benchMark.  break your limits. 