-- WAFL 0.24.21.12 INDEX READINESS - READ ONLY
SELECT schemaname, relname AS table_name, indexrelname AS index_name, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
LIMIT 100;

SELECT schemaname, relname AS table_name, seq_scan, idx_scan, n_live_tup,
       CASE WHEN seq_scan + idx_scan = 0 THEN 0 ELSE round((seq_scan::numeric / (seq_scan + idx_scan)) * 100, 2) END AS seq_scan_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC, n_live_tup DESC
LIMIT 100;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
