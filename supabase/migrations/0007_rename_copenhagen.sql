-- The UI should be fully English; "Kopenhag" was the Danish spelling.
-- Renaming an enum value updates every existing row that uses it (same
-- underlying value, just a new label) — no data migration needed.
alter type branch_enum rename value 'Kopenhag' to 'Copenhagen';
