import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),tailwindcss(),VitePWA({registerType:'autoUpdate',manifest:{name:'ShikshaSetu AI',short_name:'ShikshaSetu',description:'Learn without limits, even offline.',theme_color:'#f7f9fc',background_color:'#f7f9fc',display:'standalone',start_url:'/',icons:[{src:'/icons/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},workbox:{navigateFallback:'/index.html',globPatterns:['**/*.{js,css,html,svg,png,woff2}'],runtimeCaching:[{urlPattern:({request})=>request.destination==='image',handler:'CacheFirst',options:{cacheName:'images',expiration:{maxEntries:60,maxAgeSeconds:2592000}}}]}})],server:{host:'0.0.0.0'}});
