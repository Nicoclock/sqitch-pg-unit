-- Deploy spu:view to pg

BEGIN;

CREATE VIEW test_view AS
SELECT * FROM test;

COMMIT;
