import {apiClient} from './client';
export interface CareerPath{id:string;title:string;description:string;skills:string[];}
const demoPaths:CareerPath[]=[{id:'web',title:'Web developer',description:'Build useful experiences for the web.',skills:['HTML','CSS','JavaScript']},{id:'data',title:'Data & analytics',description:'Find patterns and turn them into useful answers.',skills:['Mathematics','Spreadsheets','Python']},{id:'educator',title:'Digital educator',description:'Help more learners discover new ideas.',skills:['Communication','Digital tools','Teaching']}];
export async function getCareerPaths():Promise<CareerPath[]>{try{return(await apiClient.get<CareerPath[]>('/career')).data;}catch{return demoPaths;}}
