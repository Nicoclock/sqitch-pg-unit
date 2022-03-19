const debug = require('debug')('ProcessExec');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * Executes a system command in the root directory of the project
 * @param {string} command - The command to execute 
 * @returns {string} The return value of the command
 */
const execute = async (command) => {
    try {
        const result = await exec(`cd ${process.cwd()}; ${command}`);
        return result.stdout;
    } catch (error) {
        debug(error);
       throw new Error(error.stdout || error.message);
    }
};

module.exports = execute;