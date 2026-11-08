import {seed} from './seed.js';
const definitions={eleve:{table:'ELEVE',pk:'Num_El',fields:['Num_El','Nom_El','Age','Ref_Niv']},matiere:{table:'MATIERE',pk:'Code_Mat',fields:['Code_Mat','Design','Coeff','Ref_Niv']},niveau:{table:'NIVEAU',pk:'Ref_Niv',fields:['Ref_Niv']},periode:{table:'PERIODE',pk:'Annee',fields:['Annee']}};
function fail(message,status=400){throw Object.assign(new Error(message),{status})}
export async function api(request,env){
 const db=env.DB,stmt=(sql,args=[])=>db.prepare(sql).bind(...args),all=async(sql,args)=>(await stmt(sql,args).all()).results,one=(sql,args)=>stmt(sql,args).first();
 try{
 if(!await one('SELECT id FROM _site_seed WHERE id=1')){await db.batch([...seed.map(([s,a])=>stmt(s.replace('INSERT INTO','INSERT OR IGNORE INTO'),a)),stmt('INSERT OR IGNORE INTO _site_seed VALUES (1)')]);}
 const parts=new URL(request.url).pathname.split('/').filter(Boolean).map(decodeURIComponent),type=parts[1],id=parts[2],method=request.method;
 const body=['POST','PUT'].includes(method)?await request.json():{};
 const text=(key)=>{const value=String(body[key]??'').trim();if(!value||value.length>120)fail('Veuillez renseigner correctement le champ '+key+'.');return value};
 async function exists(table,key,value){if(!await one(`SELECT * FROM ${table} WHERE ${key}=?`,[value]))fail('Référence introuvable : '+value+'.',404)}
 async function validateNote(n){if(typeof n.Note!=='number'||!Number.isFinite(n.Note)||n.Note<0||n.Note>20)fail('La note doit être comprise entre 0 et 20.');await exists('PERIODE','Annee',n.Annee);const el=await one('SELECT * FROM ELEVE WHERE Num_El=?',[n.Num_El]);const mat=await one('SELECT * FROM MATIERE WHERE Code_Mat=?',[n.Code_Mat]);if(!el||!mat||el.Ref_Niv!==mat.Ref_Niv)fail('La matière doit appartenir au niveau de l’élève.');}
 const noteStmt=n=>stmt('INSERT INTO NOTER (Num_El,Code_Mat,Annee,Note) VALUES (?,?,?,?) ON CONFLICT(Num_El,Code_Mat,Annee) DO UPDATE SET Note=excluded.Note',[n.Num_El,n.Code_Mat,n.Annee,n.Note]);
 async function bulletin(num,year){const eleve=await one('SELECT * FROM ELEVE WHERE Num_El=?',[num]);if(!eleve)fail('Élève introuvable.',404);const notes=await all('SELECT M.Code_Mat,M.Design,M.Coeff,N.Note,(M.Coeff*N.Note) AS Total_Point FROM MATIERE M LEFT JOIN NOTER N ON N.Code_Mat=M.Code_Mat AND N.Num_El=? AND N.Annee=? WHERE M.Ref_Niv=? ORDER BY M.Code_Mat',[num,year,eleve.Ref_Niv]);const recorded=notes.filter(n=>n.Note!==null);const totalCoeff=recorded.reduce((s,n)=>s+n.Coeff,0),totalPoints=recorded.reduce((s,n)=>s+n.Total_Point,0),raw=totalCoeff?totalPoints/totalCoeff:null;const complete=notes.length>0&&recorded.length===notes.length;return {eleve,annee:year,notes,totalCoeff,totalPoints:+totalPoints.toFixed(2),moyenne:raw===null?null:+raw.toFixed(2),complete,observation:!complete?'Incomplet':raw>=10?'Admis':'Ajourné'};}
 let result;
 if(type==='bulletin'&&method==='GET'){result=await bulletin(id,parts[3]);}
 else if((type==='resultats'||type==='admis')&&method==='GET'){await exists('PERIODE','Annee',id);const students=await all('SELECT * FROM ELEVE ORDER BY Nom_El');result=[];for(const el of students){const b=await bulletin(el.Num_El,id);if(type==='resultats'||b.observation==='Admis')result.push({...el,Moyenne:b.moyenne,Observation:b.observation,complete:b.complete,notesSaisies:b.notes.filter(n=>n.Note!==null).length,notesAttendues:b.notes.length});}}
 else if(type==='noter'){
 if(method==='GET')result=await all('SELECT * FROM NOTER');
 else if(method==='POST'){const notes=id==='batch'?body.notes:[body];if(!Array.isArray(notes)||!notes.length||notes.length>500)fail('Choisissez entre 1 et 500 notes.');for(const n of notes)await validateNote(n);await db.batch(notes.map(noteStmt));result={message:'Notes enregistrées.'};}
 else if(method==='DELETE'){await stmt('DELETE FROM NOTER WHERE Num_El=? AND Code_Mat=? AND Annee=?',[id,parts[3],parts[4]]).run();result={message:'Note supprimée.'};}
 else fail('Opération non disponible.',405);
 }
 else if(definitions[type]){
 const {table,pk,fields}=definitions[type];
 if(method==='GET')result=await all(`SELECT * FROM ${table} ORDER BY ${pk}`);
 else if(method==='POST'||method==='PUT'){
 const values={};for(const field of fields)values[field]=text(field);
 if(type==='eleve'){values.Age=Number(body.Age);if(!Number.isInteger(values.Age)||values.Age<1||values.Age>120)fail('L’âge doit être un entier entre 1 et 120.');await exists('NIVEAU','Ref_Niv',values.Ref_Niv);}
 if(type==='matiere'){values.Coeff=Number(body.Coeff);if(!Number.isFinite(values.Coeff)||values.Coeff<=0||values.Coeff>100)fail('Le coefficient doit être supérieur à 0 et inférieur ou égal à 100.');await exists('NIVEAU','Ref_Niv',values.Ref_Niv);}
 if(method==='POST'){if(await one(`SELECT * FROM ${table} WHERE ${pk}=?`,[values[pk]]))fail('Cet identifiant existe déjà. Utilisez Modifier.',409);await stmt(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`,fields.map(f=>values[f])).run();}
 else {
 await exists(table,pk,id);
 if(type==='niveau'||type==='periode'){
 if(id!==values[pk]){if(await one(`SELECT * FROM ${table} WHERE ${pk}=?`,[values[pk]]))fail('Cet identifiant existe déjà.',409);const updates=type==='niveau'?['ELEVE','MATIERE']:['NOTER'];await db.batch([stmt(`INSERT INTO ${table} (${pk}) VALUES (?)`,[values[pk]]),...updates.map(t=>stmt(`UPDATE ${t} SET ${pk}=? WHERE ${pk}=?`,[values[pk],id])),stmt(`DELETE FROM ${table} WHERE ${pk}=?`,[id])]);}
 }else{
 if(values[pk]!==id)fail('L’identifiant ne peut pas être modifié.');const old=await one(`SELECT * FROM ${table} WHERE ${pk}=?`,[id]);if(old.Ref_Niv!==values.Ref_Niv&&await one(`SELECT 1 FROM NOTER WHERE ${pk}=? LIMIT 1`,[id]))fail('Supprimez d’abord les notes associées avant de changer de niveau.',409);
 await stmt(`UPDATE ${table} SET ${fields.slice(1).map(f=>f+'=?').join(',')} WHERE ${pk}=?`,[...fields.slice(1).map(f=>values[f]),id]).run();}
 }result={message:'Enregistrement effectué.'};
 }else if(method==='DELETE'){
 await exists(table,pk,id);const references=type==='niveau'?[['ELEVE','Ref_Niv'],['MATIERE','Ref_Niv']]:type==='periode'?[['NOTER','Annee']]:[['NOTER',pk]];
 for(const [t,k]of references)if(await one(`SELECT 1 FROM ${t} WHERE ${k}=? LIMIT 1`,[id]))fail('Suppression impossible : des données sont encore associées à cet élément.',409);
 await stmt(`DELETE FROM ${table} WHERE ${pk}=?`,[id]).run();result={message:'Suppression effectuée.'};
 }else fail('Opération non disponible.',405);
 }else fail('Route introuvable.',404);
 return Response.json(result);
 }catch(e){return Response.json({error:e.status?e.message:'Une erreur est survenue. Réessayez.'},{status:e.status||500});}
}
