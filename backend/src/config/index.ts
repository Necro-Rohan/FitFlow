import dotenv from 'dotenv';
dotenv.config();

interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
}

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Environment variable ${key} is missing. Check your .env file.`);
  }
  return value;
}

export const config: AppConfig = {
  port: parseInt(getEnvVar('PORT', '4000'), 10),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  databaseUrl: getEnvVar('DATABASE_URL'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '30d'),
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
};
