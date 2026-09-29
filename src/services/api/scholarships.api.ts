import {apiClient} from './client';import {scholarships as mock} from '../../data/mockData';import type {Scholarship} from '../../types';
export async function getScholarships():Promise<Scholarship[]>{if(!navigator.onLine)return mock;try{return(await apiClient.get<Scholarship[]>('/scholarships')).data;}catch{return mock;}}
