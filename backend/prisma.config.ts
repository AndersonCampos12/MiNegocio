import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// Cargar las variables del .env
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    // ESTA LÍNEA SOLUCIONA EL EACCES Y LE DICE A PRISMA CÓMO EJECUTARLO
    seed: 'ts-node prisma/seed.ts',
  }
});