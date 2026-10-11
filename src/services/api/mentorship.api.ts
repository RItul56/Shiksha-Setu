import {apiClient} from './client';
import {useAuthStore} from '../../store/authStore';
export interface MentorRequest{id:string;mentorName:string;topic:string;note:string;status:'pending'|'accepted'|'declined'|'cancelled';createdAt:string;}
const storageKey=()=>`shiksha-mentor-requests:${useAuthStore.getState().user?.id??'guest'}`;
export async function getMentorRequests():Promise<MentorRequest[]>{if(useAuthStore.getState().demoMode){try{return JSON.parse(localStorage.getItem(storageKey())??'[]') as MentorRequest[]}catch{return[];}}return(await apiClient.get<MentorRequest[]>('/mentor-requests')).data;}
export async function requestMentor(mentorName:string,topic:string,note=''):Promise<MentorRequest>{if(useAuthStore.getState().demoMode){const item:MentorRequest={id:crypto.randomUUID(),mentorName,topic,note,status:'pending',createdAt:new Date().toISOString()};const items=await getMentorRequests();localStorage.setItem(storageKey(),JSON.stringify([item,...items]));return item;}return(await apiClient.post<MentorRequest>('/mentor-requests',{mentorName,topic,note})).data;}
export async function cancelMentorRequest(item:MentorRequest):Promise<void>{if(useAuthStore.getState().demoMode){localStorage.setItem(storageKey(),JSON.stringify((await getMentorRequests()).map(row=>row.id===item.id?{...row,status:'cancelled'}:row)));return;}await apiClient.delete(`/mentor-requests/${item.id}`);}
