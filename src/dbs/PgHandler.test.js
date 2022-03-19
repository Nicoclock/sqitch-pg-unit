require('dotenv').config();
const PgHandler = require('./PgHandler');

describe('PgHandler tests', () => {
    describe('Connecting with environment variables', () => {
        const handler = new PgHandler();
        beforeAll(async () => {
            handler.openPool();
        });
        test('should be connected with environment variables', () => {
            expect(handler.pool).toBeTruthy();
        });
        test('should be able to query', async () => {
            const rows = await handler.execute('SELECT \'test\' AS test');
            expect(rows.length).toBe(1);
            expect(rows[0]).toBeTruthy();
            expect(rows[0].test).toBe('test');
        });
        test('should be able to return a row set', async () => {
            const rows = await handler.execute('SELECT * FROM test');
            expect(rows.length).toBe(5);
        });
        test('should be able to return an integer', async () => {
            const count = await handler.execute('UPDATE test SET name=$1 WHERE id=$2', ['Gandalf the white', 5]);
            expect(count).toBe(1);
        });
        test('should throw an error for invalid query', async () => {
            try {
                await handler.execute('SELECT * FROM fake');
            } catch(error) {
                expect(error).toBeTruthy();
                expect(error.message).toBeTruthy();
            }
        });
        afterAll(async () => {
            await handler.closePool();
        });
    });
    describe('Connecting with config object', () => {
        const handler = new PgHandler();
        beforeAll(async () => {
            await handler.openPool();
            await handler.execute('CREATE USER spu WITH SUPERUSER PASSWORD \'spu\'');
            await handler.closePool();
            await handler.openPool({user: 'spu', password: 'spu'});
        });
        test('should be connected with config object', () => {
            expect(handler.pool).toBeTruthy();
        });
        test('should be able to query', async () => {
            const rows = await handler.execute('SELECT \'test\' AS test');
            expect(rows.length).toBe(1);
            expect(rows[0]).toBeTruthy();
            expect(rows[0].test).toBe('test');
        });
        test('should be able to return a row set', async () => {
            const rows = await handler.execute('SELECT * FROM test');
            expect(rows.length).toBe(5);
        });
        test('should be able to return an integer', async () => {
            const count = await handler.execute('UPDATE test SET name=$1 WHERE id=$2', ['Gandalf', 5]);
            expect(count).toBe(1);
        });
        test('should throw an error for invalid query', async () => {
            try {
                await handler.execute('SELECT * FROM fake');
            } catch(error) {
                expect(error).toBeTruthy();
                expect(error.message).toBeTruthy();
            }
        });
        afterAll(async () => {
            await handler.closePool();
            await handler.openPool();
            await handler.execute('DROP USER spu');
            await handler.closePool();
        });
    });
});