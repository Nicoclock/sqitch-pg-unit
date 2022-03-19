BEGIN;

TRUNCATE TABLE test RESTART IDENTITY;

INSERT INTO test(name) VALUES
('Bilbo'),
('Frodo'),
('Gandalf'),
('Merry'),
('Pippin');


COMMIT;