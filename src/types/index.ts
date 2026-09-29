export interface Course { id:string; title:string; description:string; category:string; level:string; lessons:number; duration:string; progress:number; color:string; icon:string; downloaded?:boolean; instructor:string; }
export interface Lesson { id:string; courseId:string; title:string; module:string; duration:string; content:string; contentHi:string; completed:boolean; downloaded:boolean; }
export interface Scholarship { id:string; name:string; provider:string; amount:string; deadline:string; state:string; level:string; category:string; match:number; eligibility:string; }
export interface SyncItem { id?:number; action:string; entity:string; payload:unknown; createdAt:string; synced:boolean; }
export interface ChatMessage { id:string; role:'assistant'|'student'; text:string; }
