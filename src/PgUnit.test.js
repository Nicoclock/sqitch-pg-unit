require('dotenv').config();
const PgUnit = require('./PgUnit');
const execute = require('./utils/ProcessExec');

describe('PgUnit tests', () => {
    test('constructor', () => {
        try {
            new PgUnit();
        } catch(error) {
            expect(error).toBeTruthy();
            expect(error.message).toBe('Missing schema name');
        }
    });
    describe('init/destroy', () => {
        const pgUnit = new PgUnit('spu3');
        test('init', async () => {
            await pgUnit.init();
            expect(pgUnit.sqitch).toBeTruthy();
            expect(pgUnit.rootHandler).toBeTruthy();
            let result = await execute('psql -d spu -c \'\\du\'');
            expect(result).toContain('spu3');
            result = await execute('psql -d spu -c \'\\dn\'');
            expect(result).toMatch(/ spu3/);
            expect(result).toMatch(/ sqitch_spu3/);
        });
        test('destroy', async () => {
            await pgUnit.destroy();
            let result = await execute('psql -d spu -c \'\\du\'');
            expect(result).not.toContain('spu3');
            result = await execute('psql -d spu -c \'\\dn\'');
            expect(result).not.toMatch(/ spu3/);
            expect(result).not.toMatch(/ sqitch_spu3/);
        });
    });
    describe('Sqitch commands', () => {
        const pgUnit = new PgUnit('spu3');
        beforeAll(async () => {
            await pgUnit.init()
        });
        describe('Migration specified', () => {
            test('should deploy to the view migration', async () => {
                const result = await pgUnit.deploy('view');
                expect(result).toBe(true);
            });
            test('should fail with unexisting migration', async () => {
                const result = await pgUnit.deploy('views');
                expect(result).toBe(false);
            });
            test('should verify the view migration', async () => {
                const result = await pgUnit.verify('view');
                expect(result).toBe(true);
            });
            test('should fail with unexisting migration', async () => {
                const result = await pgUnit.revert('views');
                expect(result).toBe(false);
            });
            test('should revert to the init migration', async () => {
                let result = await pgUnit.revert('init');
                expect(result).toBe(true);
                result = await pgUnit.verify('view');
                expect(result).toBe(false);
            });
        });
        describe('No migration specified', () => {
            test('should deploy all migrations', async () => {
                const result = await pgUnit.deploy();
                expect(result).toBe(true);
            });
            test('should verify all migrations', async () => {
                const result = await pgUnit.verify();
                expect(result).toBe(true);
            });
            test('should revert all migrations', async () => {
                let result = await pgUnit.revert();
                expect(result).toBe(true);
                result = await execute('PGUSER=spu3 PGPASSWORD=spu3 psql -d spu -c \'\\dt\'');
                expect(result).not.toMatch(/spu3.*\|.*test/);
            });
        });
        afterAll(async () => {
            await pgUnit.destroy()
        });
    });
    describe('seed', () => {
        const pgUnit = new PgUnit('spu3');
        beforeAll(async () => {
            await pgUnit.init()
        });
        test('Should fail when called without file path', async () => {
            const result = await pgUnit.seed();
            expect(result).toBe(false);
        });
        test('Should fail when seed file is not found', async () => {
            const filePath = 'dnlkdfnlk';
            const result = await pgUnit.seed(filePath);
            expect(result).toBe(false);
        });
        test('Should seed table when given a correct relative file path', async () => {
            let filePath = './data/seeding.sql';
            let result = await pgUnit.seed(filePath);
            expect(result).toBe(true);
            filePath = 'data/seeding.sql';
            result = await pgUnit.seed(filePath);
            expect(result).toBe(true);
        });
        afterAll(async () => {
            await pgUnit.destroy()
        });
    });
});