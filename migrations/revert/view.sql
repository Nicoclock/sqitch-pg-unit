-- Revert spu:view from pg

BEGIN;

DROP VIEW test_view;

COMMIT;
