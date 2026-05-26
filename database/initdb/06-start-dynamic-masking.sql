-- Create mask.* views (replaces broker startup call).
\connect chinook

SELECT anon.start_dynamic_masking();
