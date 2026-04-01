-- Migration 019: Add soft delete to users table

-- Add deleted_at column to users table
alter table users add column deleted_at timestamptz;

-- Create index on deleted_at for better query performance
create index idx_users_deleted_at on users(deleted_at);

-- Create index on deleted_at and is_active for common queries
create index idx_users_active_users on users(deleted_at, is_active) 
where deleted_at is null;
