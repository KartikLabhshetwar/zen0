-- Script to clear PostgreSQL query plan cache and reset connections
-- This fixes the "cached plan must not change result type" error

-- Clear the query plan cache
DISCARD PLANS;

-- Reset all cached data
DISCARD ALL;

-- Refresh the database statistics
ANALYZE;
