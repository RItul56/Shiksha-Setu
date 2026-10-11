import {apiClient} from './client';
export interface UserSession{id:string;name:string;email:string|null;role:'student'|'admin';language:'en'|'hi';avatarData?:string|null;}
export interface LoginInput{identifier:string;password:string;}export interface RegisterInput{fullName:string;identifier:string;password:string;preferredLanguage:'en'|'hi';state:string;educationLevel:string;responsibleConsent:true;}
export async function login(input:LoginInput):Promise<UserSession>{return(await apiClient.post<{user:UserSession}>('/auth/login',input)).data.user;}
export async function register(input:RegisterInput):Promise<UserSession>{return(await apiClient.post<{user:UserSession}>('/auth/register',input)).data.user;}
export async function logout():Promise<void>{await apiClient.post('/auth/logout');}
export async function currentUser():Promise<UserSession>{return(await apiClient.get<{user:UserSession}>('/auth/me')).data.user;}
export async function exportStudentData():Promise<unknown>{return(await apiClient.get('/auth/export')).data;}
export async function deleteAccount():Promise<void>{await apiClient.delete('/auth/me');}
