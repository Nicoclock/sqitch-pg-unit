const debugQuery = require('debug')('SqlQuery');
const debugError = require('debug')('SqlError');
const {Pool} = require('pg');

class PgHandler {
    pool;

    /**
     * Connects to a postgreSQL database with a pool
     * @param {object} config - Optional, can be use to override/skip environment variables 
     * @returns {object} The PgHandler instance
     */
    openPool(config={}) {
        this.pool = new Pool({
            user: process.env.PGUSER, 
            password: process.env.PGPASSWORD, 
            host: process.env.PGHOST, 
            port: 5432, 
            database: process.env.PGDATABASE,
            ...config      
        });
        return this;
    };

    /**
     * Executes requests on the PostgreSQL server
     * @param {string} sql - SQL text
     * @param {array} data - Optional, data for prepared queries
     * @returns a set of rows or the number of recs modified by the request
     */
    async execute(sql, data) {
        debugQuery(`${sql}${data ? ` - ${data}` : ''}`)
        try {
            const result = await this.pool.query(sql, data);
            return result.rows && result.rows.length ? result.rows : result.rowCount;
        } catch (error) {
            debugError(error);
            throw error;
        }
    };

    /**
     * Closes the pool
     */
    async closePool() {
        await this.pool.end();
    }

}

module.exports = PgHandler;