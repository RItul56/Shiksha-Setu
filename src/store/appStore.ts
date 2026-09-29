import {create} from 'zustand';
interface AppState{language:'en'|'hi';dataSaver:boolean;sidebarOpen:boolean;setLanguage:(language:'en'|'hi')=>void;setDataSaver:(value:boolean)=>void;setSidebarOpen:(value:boolean)=>void;}
export const useAppStore=create<AppState>((set)=>({language:'en',dataSaver:false,sidebarOpen:false,setLanguage:(language)=>set({language}),setDataSaver:(dataSaver)=>set({dataSaver}),setSidebarOpen:(sidebarOpen)=>set({sidebarOpen})}));
