const execute = require('./ProcessExec');

describe('ProcessExec tests', () => {
    test('shoud return a list of files/directories', async() => {
        const result = await execute('ls');
        expect(result).toBeTruthy();
        expect(result).toContain('README.md');
    });
    test('shoud return an empty string for commands without return values', async() => {
        let result = await execute('touch test');
        expect(result).toBe('');
        result = await execute('rm test');
        expect(result).toBe('');
    });
    test('shoud throw an error for invalid commands', async() => {
        try {
            await execute('kjsdkjfhk');
        } catch (error) {
            expect(error).toBeTruthy();
            expect(error.message).toBeTruthy();
            
        }
    });

});