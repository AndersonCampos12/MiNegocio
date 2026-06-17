import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseService {
    private static instance: PrismaClient;

    private constructor() { }

    public static getInstance(): PrismaClient {
        if (!DatabaseService.instance) {
            const connectionString = process.env.DATABASE_URL;
            const pool = new Pool({ connectionString });
            const adapter = new PrismaPg(pool);

            DatabaseService.instance = new PrismaClient({ adapter });
        }
        return DatabaseService.instance;
    }
}

export const prisma = DatabaseService.getInstance();