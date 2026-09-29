import {db} from './db';
export async function queueSync(action:string,entity:string,payload:unknown):Promise<void>{await db.syncQueue.add({action,entity,payload,createdAt:new Date().toISOString(),synced:false});}
