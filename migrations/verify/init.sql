-- Verify spu:init on pg

BEGIN;

SELECT * FROM test WHERE false;

ROLLBACK;
