import {create} from 'zustand';
interface AuthState{user:{name:string;email:string}|null;login:(email:string)=>void;logout:()=>void;}
export const useAuthStore=create<AuthState>((set)=>({user:{name:'Aarav',email:'aarav@example.com'},login:(email)=>set({user:{name:email.split('@')[0]||'Student',email}}),logout:()=>set({user:null})}));
