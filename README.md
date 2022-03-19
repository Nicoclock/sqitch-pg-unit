# sqitch-pg-unit

Provides tools to create a schema-based concurrent-safe environment to use Sqitch migrations and connect to a database in unit tests

## Technical stack

- [PostgreSQL](https://www.postgresql.org/)  >= v12. 
- [Sqitch](https://sqitch.org/)  latest. 

## How does it work ?

Each unit test file will be able to use its own user and schema in database  
After deploying migrations (and seeding data) on this schema, the test suite will be able to manipulate a perfect copy of the production database structure  
Though test suites are all launched together, the schema per file pattern will prevent problems of concurrent acces to records and preserve data integrity during tests

## Installation

```bash
npm install sqitch-pg-unit
```

## Configuration

Some environment variables need to be set up :
- PGHOST
- PGDATABASE
- PGUSER
- PGPASSWORD

PGUSER and PGPASSWORD must reference a superuser or the owner of the database  
This user will be used to create the test schemas and manipulate Sqitch migrations on it

`.env`

```bash
PGHOST=localhost
PGDATABASE=my_database
PGUSER=superuser_or_owner
PGPASSWORD=my_password
```

**Also needed : a valid sqitch.conf file in the root directory**

## Usage

### Caution
**It is highly recommended to test deploy and revert scripts before using this package**  
**Not doing so may provoque a failure in environment destruction and leave a very powerfull user alive**

### Package content
#### PgUnit class : creates the test environment (PostgreSQL schema and user), can use basic Sqitch commands and seed tables
```js
const { PgUnit } = require('sqitch-pg-unit');
/* 
The key is used to create the new schema, a user and its password.
No security issue, the user is deleted when the environment is detroyed at the end of a test suite
*/
const key = 'my_ref_name';
const unit = new PgUnit(key);

describe('Test Suite', () => {
    beforeAll(async () => {
        // creation of the environment in database
        await unit.init();
        // deploys all migrations from sqitch.plan
        await unit.deploy();
        // seeding from an sql file, path must be relative to the root directory
        await unit.seed('./data/seeding.sql');
    });

    // lots of unit tests
    
    afterAll(async () => {
        /*
        Important : revert all migration before detroying the environment
        It's necessary to destroy test schema and user without error
        */
        await unit.revert();
        // destruction of the environment
        await unit.destroy();
    });
});
```

#### Pghandler class : used to manage connections to PostgreSQL database
```js
const { PgUnit, PgHandler } = require('sqitch-pg-unit');

const unit = new PgUnit('my_ref_name');
/* 
Using environment variables, avoid usage in unit tests unless it's absolutly necessary
With this user, queries will affect the "real" database (public schema), be careful
*/
const superHandler = new PgHandler();

/* 
Using configuration object
Recognized properties are
- user
- password
- host
- port
- database
All properties are optional, when not provided the environment variable will be used instead
*/
const testHandler = new PgHandler({
    user: 'my_ref_name',
    password: 'my_ref_name'
});

describe('Test Suite', () => {
    beforeAll(async () => {
        await unit.init();
        await unit.deploy();
        await unit.seed('./data/seeding.sql');
        
        // initiates the connection with PostgreSQL
        await testHandler.openPool();
    });

    // lots of unit tests manipulating data without shivers down the spine 
    test('My zen queries', async () => {
        /*
        execute(sqlString, dataArray) can return 
        - an array of records
        - the number of affected records when no return value is specified
        */

        // get one visitor
        const [visitor] = await testHandler.execute('SELECT * FROM visitor WHERE id=$1', [5]);
        expect(visitor.name).toBe('Gandalf');

        // get all visitors
        const visitors = await testHandler.execute('SELECT * FROM visitor');
        expect(visitors.length).toBe(5);

        // add a visitor
        const newVisitor = await testHandler.execute('INSERT INTO visitor(name) VALUES($1) RETURNING *', ['Aragron']);

        // update a visitor
        let result = await testHandler.execute('UPDATE visitor SET name=$1 WHERE name=$2', ['Aragorn', 'Aragron']);
        expect(result).toBe(1);

        // delete all visitors with no fear
        result = await testHandler.execute('DELETE FROM visitor');
        expect(result).toBe(6);

    });

    afterAll(async () => {
        // to exit tests gracefully, all connections must be closed
        await testHandler.closePool();

        await unit.revert();
        await unit.destroy();
    });
});
```

#### execute function : can run system commands in async mode (used internally, can be useful in unit tests for psql commands)
```js
const { execute } = require('sqitch-pg-unit');

/* 
Checks the presence of table "my_table" on the test schema "my_ref_name"
PGUSER and PGPASSWORD must be set to use the test user
*/
const result = await execute('PGUSER=my_ref_name PGPASSWORD=my_ref_name psql -d my_database -c \'\\dt\'');
expect(result).toMatch(/my_ref_name.*\|.*my_table/);
```

## Testing a specific migration


```js
const { PgUnit, PgHandler } = require('sqitch-pg-unit');

const unit = new PgUnit('my_ref_name');
const db = new PgHandler({
    user: 'my_ref_name',
    password: 'my_ref_name'
});

describe('Test Suite', () => {
    beforeAll(async () => {
        await unit.init();
        await db.openPool();
    });

    // some tests

    describe('Second migration', () => {
        beforeAll(async () => {
            // each Sqitch command returns a boolean to true when executes, false when fails
            const isDeployed = await unit.deploy('second_migration');
            // although scripts should already have been tested, the verify command is available
            const isVerified = await unit.verify('second_migration');
            console.log(`Deployed: ${isDeployed} - Verified : ${isVerified}`)
        });

        // some tests

        afterAll(async () => {
            // goes back to the first migration
            const isReverted = await unit.revert('first_migration');
            console.log(`Reverted: ${isReverted}`);
        });
    })

    // some other tests

    afterAll(async () => {
        await db.closePool();
        await unit.revert();
        await unit.destroy();
    });
});
```


## Debug

The DEBUG environment variable can be used to
- log SQL queries : `DEBUG=SqlQuery`
- log SQL errors : `DEBUG=SqlError`
- log both : `DEBUG=SqlQuery,SqlError or DEBUG=*`

## Setup to run project unit tests

### Jest must be installed on the system

```bash
npm install -g jest
```

### Database setup

```bash
createdb spu
# from root directory
sqitch deploy
psql <-U username> -d spu -f ./data/seeding.sql
```

### Tests launch

```bash
# from root directory
npm test
```