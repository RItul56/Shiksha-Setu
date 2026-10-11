import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {pool} from './db.js';

try{const path=fileURLToPath(new URL('../migrations/001_initial.sql',import.meta.url));const sql=await readFile(path,'utf8');await pool.query(sql);console.info('Database migration completed.');}catch(error){console.error('Migration failed:',error instanceof Error?error.message:error);process.exitCode=1;}finally{await pool.end();}
