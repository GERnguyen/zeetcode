// This file contains all the basic configuration logic for the app server to work
import dotenv from 'dotenv';
import path from 'path';

type ServerConfig = {
    PORT: number,
    DB_URL: string,
    INTERNAL_SERVICE_TOKEN: string,
    JWT_ACCESS_SECRET: string
}

function loadEnv() {
    dotenv.config({ path: path.resolve(__dirname, "../../.env") });
    console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
    PORT: Number(process.env.PORT) || 3001,
    DB_URL: process.env.DB_URL || "",
    INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || "",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || ""
};
