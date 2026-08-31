CREATE FUNCTION prevent_report_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ReportEvent records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_report_event_mutation
  BEFORE UPDATE ON "ReportEvent"
  FOR EACH ROW EXECUTE FUNCTION prevent_report_event_mutation();
