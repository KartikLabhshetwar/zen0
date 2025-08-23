-- Script to reset database and fix constraint conflicts
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "verificationtoken" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "conversations" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- This will allow Prisma to recreate all tables with correct constraints
