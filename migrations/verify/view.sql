-- Verify spu:view on pg

BEGIN;

SELECT * FROM test_view WHERE false;

ROLLBACK;
