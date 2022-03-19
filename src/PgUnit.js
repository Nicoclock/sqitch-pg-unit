const SqitchHandler = require('./utils/SqitchHandler');
const PgHandler = require('./dbs/PgHandler');

class PgUnit {

    schema;
    sqitch;
    rootHandler;

    /**
     * Setup of a SqitchHandler and instanciation of a PgHandler from environment variables
     * The user specified in .env must have creation permissions
     * @param {string} schema 
     */
    constructor(schema) {
        if (!schema)
            throw new Error(`Missing schema name`)
        this.schema = schema;
        this.sqitch = new SqitchHandler(this.schema);
        this.rootHandler = new PgHandler();
    }

    /**
     * Creates a specific user and schema for test purposes
     */
    async init() {
        await this.rootHandler.openPool();

        const query = `
        -- création of the test user
        CREATE USER ${this.schema} WITH SUPERUSER PASSWORD '${this.schema}';
        -- création of the test schema
        CREATE SCHEMA IF NOT EXISTS ${this.schema};
        -- création of a dedicated sqitch schema
        CREATE SCHEMA IF NOT EXISTS sqitch_${this.schema};
        `;
        await this.rootHandler.execute(query);
    }

    /**
     * Wrapper to deploy all migrations or to a specified migration with SqitchHandler
     * @param {string} migration - Optional
     * @returns {boolean} true if deploy is successfull, false otherwise
     */
    async deploy(migration) {
        try {
            await this.sqitch.deploy(migration);
            return true;
        } catch(error) {
            return false;
        }
    };

    /**
     * Wrapper to revert all migrations or to a specified migration with SqitchHandler
     * @param {string} migration - Optional
     * @returns {boolean} true if revert is successfull, false otherwise
     */
     async revert(migration) {
         try {
            await this.sqitch.revert(migration);
            return true;
        } catch(error) {
            return false;
        }
    };

    /**
     * Wrapper to verify all migrations or to a specified migration with SqitchHandler
     * @param {string} migration - Optional
     * @returns {boolean} true if verify is successfull, false otherwise
     */
     async verify(migration) {
        try {
            const result = await this.sqitch.verify(migration);
            return result.includes('Verify successful');
        } catch(error) {
            return false;
        }
    };

    /**
     * Wrapper toseed database objects with SqitchHandler
     * @param {string} filePath - A path relative to the root directory for the seeding file
     * @returns {boolean} true if seed is successfull, false otherwise
     */
     async seed(filePath) {
        try {
            const result = await this.sqitch.seed(filePath);
            return result.includes('COMMIT');
        } catch(error) {
            return false;
        }
    };

    /**
     * Destroys the specific user and schema used for test purposes
     */
    async destroy() {
        const query = `
        -- Destruction of the sqitch schema tables
        DROP TABLE IF EXISTS 
            sqitch_${this.schema}.releases, 
            sqitch_${this.schema}.projects, 
            sqitch_${this.schema}.changes, 
            sqitch_${this.schema}.tags, 
            sqitch_${this.schema}.dependencies, 
            sqitch_${this.schema}.events;
        -- Destruction of the sqitch schema
        DROP SCHEMA IF EXISTS sqitch_${this.schema};
        -- Destruction of the test schema
        DROP SCHEMA IF EXISTS ${this.schema};
        -- Destruction of the test user
        DROP USER IF EXISTS ${this.schema};
        `;
        await this.rootHandler.execute(query);
        await this.rootHandler.closePool();
    }
}

module.exports = PgUnit;