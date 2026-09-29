import {apiClient} from './client';
export interface LoginInput{email:string;password:string;}export interface RegisterInput{name:string;email:string;password:string;preferredLanguage:string;state:string;educationLevel:string;}
export async function login(input:LoginInput):Promise<void>{await apiClient.post('/auth/login',input);}
export async function register(input:RegisterInput):Promise<void>{await apiClient.post('/auth/register',input);}
export async function logout():Promise<void>{await apiClient.post('/auth/logout');}
