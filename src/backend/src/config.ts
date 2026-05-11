import dotenv from 'dotenv';

dotenv.config();

export const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'open_agency',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    model: process.env.LLM_MODEL || 'gpt-4-turbo-preview',
    apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  integrations: {
    neo4j: {
      user: process.env.NEO4J_USER || 'neo4j',
      password: process.env.NEO4J_PASSWORD || '',
    },
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
    },
    hubspot: {
      apiKey: process.env.HUBSPOT_API_KEY,
    },
    notion: {
      apiKey: process.env.NOTION_API_KEY,
    },
  },
};

export default config;