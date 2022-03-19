const fs = require('fs');
const path = require('path');
const execute = require('./ProcessExec');

class SqitchHandler {

    schema;

    /**
     * Initialize the SQL schema to deploy/revert/verify to
     * @param {string} schema 
     * @param {string} path - Optional, relative path from root directory to sqitch.conf
     */
    constructor(schema, path='sqitch.conf') {
        if (!schema)
            throw new Error(`Missing schema name`)
        if (!fs.existsSync(`${process.cwd()}/${path}`))
            throw new Error(`No sqitch.conf found in ${process.cwd()}`)
        this.schema = schema;
    };

    /**
     * Create credentials for sqitch commands using command line environment variables
     * @returns {string} The command line credentials
     */
    credentials() {
        return `PGUSER=${this.schema} PGPASSWORD=${this.schema}`;
    };

    /**
     * Allows to make some seeding for test purposes
     * @param {string} filePath - Relative file path from root folder
     * @returns {string} Results of the command
     */
    async seed(filePath) {
        if (!filePath)
            throw new Error(`Missing seed file`);
        const fullPath = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(fullPath))
            throw new Error(`File ${fullPath} doesn't exist`);
        return await execute(`${this.credentials()} psql -d ${process.env.PGDATABASE} -f ${fullPath}`);
    };

    /**
     * Execute sqitch deploy
     * @param {string} migration - Optional, allows to limit deployment to a given migration 
     * @returns {string} Results of the command
     */
    async deploy(migration) {
        return await execute(`${this.credentials()} sqitch deploy${migration ? ` ${migration}` : ''} --registry sqitch_${this.schema}`);
    };

    /**
     * Execute sqitch revert
     * @param {string} migration - Optional, allows to revert to a given migration
     * @returns {string} Results of the command
     */
     async revert(migration) {
        return await execute(`${this.credentials()} sqitch revert -y${migration ? ` ${migration}` : ''} --registry sqitch_${this.schema}`);
    };

    /**
     * Execute sqitch verify
     * @param {string} migration - Optional, allows to verify to a given migration
     * @returns {string} Results of the command
     */
     async verify(migration) {
        return await execute(`${this.credentials()} sqitch verify${migration ? ` ${migration}` : ''} --registry sqitch_${this.schema}`);
    }
};

module.exports = SqitchHandler;