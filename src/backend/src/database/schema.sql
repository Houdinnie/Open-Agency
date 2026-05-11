-- Open Agency Database Schema
-- Run this against your PostgreSQL database

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Events table for event bus history
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    source VARCHAR(100),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    priority INTEGER DEFAULT 0,
    processed BOOLEAN DEFAULT FALSE,
    agent_id VARCHAR(100)
);

-- Agents table for agent state
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    status VARCHAR(50) DEFAULT 'idle',
    capabilities JSONB DEFAULT '[]',
    metrics JSONB DEFAULT '{}',
    last_active TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table for task management
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    agent_id VARCHAR(100),
    linear_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Memory table with vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    memory_type VARCHAR(50) DEFAULT 'general',
    importance INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS memory_embedding_idx ON memory USING ivfflat (embedding vector_cosine_ops);

-- Conversations table for agent interactions
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Price history for pricing optimization
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(100) NOT NULL,
    price NUMERIC NOT NULL,
    cost NUMERIC,
    demand_level INTEGER,
    competitor_price NUMERIC,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads table for sales pipeline
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    company VARCHAR(255),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    score INTEGER DEFAULT 0,
    enrichment_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted_at TIMESTAMPTZ
);

-- Function to perform vector similarity search
CREATE OR REPLACE FUNCTION find_similar_memories(
    query_embedding vector(1536),
    match_count INTEGER DEFAULT 5,
    memory_type_filter VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.metadata,
        1 - (m.embedding <=> query_embedding) AS similarity
    FROM memory m
    WHERE memory_type_filter IS NULL OR m.memory_type = memory_type_filter
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS events_type_idx ON events(type);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS memory_type_idx ON memory(memory_type);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);