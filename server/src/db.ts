import 'dotenv/config';
import {Pool} from 'pg';

const databaseUrl=process.env.DATABASE_URL;
if(!databaseUrl)throw new Error('DATABASE_URL is required. Copy .env.example and configure PostgreSQL.');
export const pool=new Pool({connectionString:databaseUrl,max:Number(process.env.PG_POOL_MAX??20),idleTimeoutMillis:30_000,connectionTimeoutMillis:5_000,statement_timeout:8_000,application_name:'shikshasetu-api'});
pool.on('error',(error)=>{console.error('Unexpected idle database client error',error.message);});
