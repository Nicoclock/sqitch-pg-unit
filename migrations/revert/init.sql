-- Revert spu:init from pg

BEGIN;

DROP TABLE test;

COMMIT;
