# benchMark Api

Strength-training tracking designed with the user in mind.  Create, update, and review workouts in real time - with the user remaining in the driver seat for the control of their data.

`benchMark Api` is the backend for `benchMark`.  To see `benchMark` in action, check out LINK-PLACEHOLDER.

The `benchMark` front end can be found at: [benchMark-client](https://github.com/trevorjalt/benchmark-client/ "benchMark Client")

## ready to break some limits?

Here at `benchmark` we are strength-training enthusiasts. We understand the amount of stuff you carry at the gym as you work to break your limits. So we're here to help. `benchMark` is an easy solution allowing you to leave that pen and paper at home, and quickly log and track your workout progress in the same device that plays those tunes to keep you pumped up.

## the tech.

#### backend.

* Node and Express
  * Authentication via JWT
  * RESTful Api
* Testing
  * Supertest (integration)
  * Mocha and Chai (unit)
* Database
  * Postgres
  * Knex.js - SQL wrapper

#### production.

Deployed via Heroku

## setup.

#### requirements.
* Postgres v8.3.3
* Node v12.18.3

#### local setup.

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

## have fun!