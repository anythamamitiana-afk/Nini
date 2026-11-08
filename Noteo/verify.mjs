import {DatabaseSync} from 'node:sqlite';import{readFileSync}from'node:fs';import assert from'node:assert/strict';import {api} from './worker/api.js';
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');sqlite.exec(readFileSync('drizzle/0000_schema.sql','utf8'));
const DB={prepare(sql){let args=[];return {bind(...a){args=a;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:r.changes}}}}},async batch(items){sqlite.exec('BEGIN');try{const r=await Promise.all(items.map(x=>x.run()));sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}};
async function call(path,method='GET',body,status=200){const r=await api(new Request('https://test/api/'+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}),{DB});const json=await r.json();assert.equal(r.status,status,JSON.stringify(json));return json}
assert.equal((await call('eleve')).length,3);assert.equal((await call('bulletin/E01/2025-2026')).moyenne,12.44);assert.equal((await call('admis/2025-2026')).length,1);
assert.equal((await call('bulletin/E03/2025-2026')).observation,'Incomplet');assert.equal((await call('bulletin/E03/2025-2026')).moyenne,null);
await call('niveau','POST',{Ref_Niv:'L3'});await call('periode','POST',{Annee:'2026-2027'});
await call('eleve','POST',{Num_El:'TEST',Nom_El:'Test',Age:20,Ref_Niv:'L3'});await call('eleve','POST',{Num_El:'TEST',Nom_El:'Test',Age:20,Ref_Niv:'L3'},409);
await call('matiere','POST',{Code_Mat:'T1',Design:'Test matière',Coeff:2,Ref_Niv:'L3'});
await call('noter','POST',{Num_El:'TEST',Code_Mat:'T1',Annee:'2026-2027',Note:21},400);
await call('noter','POST',{Num_El:'TEST',Code_Mat:'M101',Annee:'2026-2027',Note:12},400);
await call('noter/batch','POST',{notes:[{Num_El:'TEST',Code_Mat:'T1',Annee:'2026-2027',Note:0}]});assert.equal((await call('bulletin/TEST/2026-2027')).observation,'Ajourné');
await call('eleve/TEST','DELETE',undefined,409);await call('niveau/L3','DELETE',undefined,409);await call('matiere/T1','DELETE',undefined,409);await call('periode/2026-2027','DELETE',undefined,409);
await call('niveau/L3','PUT',{Ref_Niv:'Licence 3'});await call('periode/2026-2027','PUT',{Annee:'2027-2028'});assert.equal((await call('bulletin/TEST/2027-2028')).eleve.Ref_Niv,'Licence 3');
await call('eleve/TEST','PUT',{Num_El:'TEST',Nom_El:'Modifié',Age:21,Ref_Niv:'Licence 3'});
await call('noter/TEST/T1/2027-2028','DELETE');await call('eleve/TEST','DELETE');await call('matiere/T1','DELETE');await call('niveau/Licence%203','DELETE');await call('periode/2027-2028','DELETE');
await call('noter/batch','POST',{notes:[{Num_El:'E01',Code_Mat:'M101',Annee:'2025-2026',Note:15},{Num_El:'E02',Code_Mat:'M101',Annee:'2025-2026',Note:-1}]},400);assert.equal((await call('noter')).find(n=>n.Num_El==='E01'&&n.Code_Mat==='M101').Note,14);
await call('noter/E01/M101/2025-2026','DELETE');assert.equal((await call('bulletin/E01/2025-2026')).observation,'Incomplet');
console.log('OK : CRUD, renommage des références, contraintes, notes 0–20, saisie atomique, bulletins incomplets et suppression protégée.');
