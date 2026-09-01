-- The integration suite drops and recreates its schema on every run, so it gets
-- its own database. Development data must never be reachable from a test run.
CREATE DATABASE mis_servicios_test;
GRANT ALL PRIVILEGES ON DATABASE mis_servicios_test TO mis_servicios;
