require('dotenv').config();
const SqitchHandler = require('./SqitchHandler');
const PgHandler = require('../dbs/PgHandler');
const execute = require('./ProcessExec');

const db = new PgHandler();

const setup = async () => {
    await db.openPool();
    await db.execute(`
        CREATE USER spu2 WITH SUPERUSER PASSWORD 'spu2';
        CREATE SCHEMA IF NOT EXISTS spu2;
        CREATE SCHEMA IF NOT EXISTS sqitch_spu2;
    `);
}

const teardown = async () => {
    await db.execute(`
        DROP TABLE IF EXISTS 
            sqitch_spu2.releases, 
            sqitch_spu2.projects, 
            sqitch_spu2.changes, 
            sqitch_spu2.tags, 
            sqitch_spu2.dependencies, 
            sqitch_spu2.events;
        DROP SCHEMA IF EXISTS sqitch_spu2;
        DROP SCHEMA IF EXISTS spu2;
        DROP USER IF EXISTS spu2;
    `);
    await db.closePool();
}

describe('SqitchHandler tests', () => {
    beforeAll(async () => {
        await setup();
    });
    describe('constructor', () => {
        test('Should throw an error when called without schema name', async () => {
            try {
                new SqitchHandler();
            } catch(error) {
                expect(error).toBeTruthy();
                expect(error.message).toBe('Missing schema name');
            }
        });
        test('Should throw an error when sqitch.conf is not found in root directory', () => {
            try {
                new SqitchHandler('test', 'sqitch.confx');
            } catch(error) {
                expect(error).toBeTruthy();
                expect(error.message).toMatch(/^No sqitch.conf found in/);
            }
        });
        test('Should set up the schema property', () => {
            const handler = new SqitchHandler('test');
            expect(handler.schema).toBe('test');
        });
    });
    describe('credentials', () => {
        test('Credentials should be initialized with schema name', () => {
            const handler = new SqitchHandler('test');
            expect(handler.credentials()).toBe('PGUSER=test PGPASSWORD=test');
        });
    });
    describe('seed', () => {
        const handler = new SqitchHandler('spu2');
        test('Should throw an error when called without file path', async () => {
            try {
                await handler.seed();
            } catch(error) {
                expect(error).toBeTruthy();
                expect(error.message).toBe('Missing seed file');
            }
        });
        test('Should throw an error when seed file is not found', async () => {
            const filePath = 'dnlkdfnlk';
            try {
                await handler.seed(filePath);
            } catch(error) {
                expect(error).toBeTruthy();
                expect(error.message).toBe(`File ${process.cwd()+'/'+filePath} doesn't exist`);
            }
        });
        test('Should seed table when given a correct relative file path', async () => {
            let filePath = './data/seeding.sql';
            let result = await handler.seed(filePath);
            expect(result).toBeTruthy();
            expect(result).toContain('COMMIT');
            filePath = 'data/seeding.sql';
            result = await handler.seed(filePath);
            expect(result).toBeTruthy();
            expect(result).toContain('COMMIT');
        });
    });
    describe('Sqitch commands', () => {
        const handler = new SqitchHandler('spu2');
        describe('Migration specified', () => {
            test('should deploy to the view migration', async () => {
                await handler.deploy('view');
                let result = await execute('psql -d spu -c \'\\dn\'');
                expect(result).toMatch(/ sqitch_spu2/);
                result = await execute('PGUSER=spu2 PGPASSWORD=spu2 psql -d spu -c \'\\dt\'');
                expect(result).toMatch(/spu2.*\|.*test/);
            });
            test('should verify the view migration', async () => {
                const result = await handler.verify('view');
                expect(result).toContain('Verify successful');
            });
            test('should revert to the init migration', async () => {
                await handler.revert('init');
                try {
                    await handler.verify('view');
                } catch(error) {
                    expect(error).toBeTruthy();
                }
            });
        });
        describe('No migration specified', () => {
            test('should deploy all migrations', async () => {
                await handler.deploy();
                let result = await execute('psql -d spu -c \'\\dn\'');
                expect(result).toMatch(/ sqitch_spu2/);
                result = await execute('PGUSER=spu2 PGPASSWORD=spu2 psql -d spu -c \'\\dt\'');
                expect(result).toMatch(/spu2.*\|.*test/);
            });
            test('should verify all migrations', async () => {
                const result = await handler.verify();
                expect(result).toContain('Verify successful');
            });
            test('should revert all migrations', async () => {
                await handler.revert();
                const result = await execute('PGUSER=spu2 PGPASSWORD=spu2 psql -d spu -c \'\\dt\'');
                expect(result).not.toMatch(/spu2.*\|.*test/);
            });
        });
    });
    afterAll(async () => {
        await teardown();
    });
});