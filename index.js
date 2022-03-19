const execute = require('./src/utils/ProcessExec');
const PgHandler = require('./src/dbs/PgHandler');
const PgUnit = require('./src/PgUnit');

module.exports = {
    execute,
    PgHandler,
    PgUnit
}