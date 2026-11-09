import{mkdirSync,readFileSync,writeFileSync}from'node:fs';
const assets=Object.fromEntries(['index.html','style.css','local-api.js','app.js'].map(f=>['/'+f,readFileSync('../docs/'+f,'utf8')]));
let api=readFileSync('worker/api.js','utf8').replace("import {seed} from './seed.js';",readFileSync('worker/seed.js','utf8').replace('export ',''));
const code=api+'\nconst assets='+JSON.stringify(assets)+`;\nexport default {async fetch(request,env){const p=new URL(request.url).pathname;if(p.startsWith('/api/'))return api(request,env);const path=p==='/'?'/index.html':p;return new Response(assets[path]??'Page introuvable',{status:assets[path]?200:404,headers:{'Content-Type':path.endsWith('.css')?'text/css':path.endsWith('.js')?'application/javascript':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'}});}};`;
mkdirSync('dist/server',{recursive:true});writeFileSync('dist/server/index.js',code);
