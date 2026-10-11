import {apiClient} from './client';
export interface StudentProfile {fullName:string;email:string|null;state:string;educationLevel:string;preferredLanguage:'en'|'hi';avatarData:string|null;}
export async function getProfile():Promise<StudentProfile>{return(await apiClient.get<StudentProfile>('/profile')).data;}
export async function updateProfile(profile:StudentProfile):Promise<StudentProfile>{return(await apiClient.put<StudentProfile>('/profile',profile)).data;}
