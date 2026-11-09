(()=>{
const storageKey=`noteo-data-v1:${location.hostname}:${location.pathname.split('/').filter(Boolean)[0]||'root'}`;
const initial={
eleve:[{Num_El:'E03',Nom_El:'Randria Paul',Age:18,Ref_Niv:'L1'},{Num_El:'E02',Nom_El:'Rabe Marie',Age:20,Ref_Niv:'L1'},{Num_El:'E01',Nom_El:'Rakoto Jean',Age:19,Ref_Niv:'L1'}],
matiere:[{Code_Mat:'M101',Design:'Algorithmique',Coeff:4,Ref_Niv:'L1'},{Code_Mat:'M102',Design:'Bases de Données',Coeff:3,Ref_Niv:'L1'},{Code_Mat:'M103',Design:'Anglais',Coeff:2,Ref_Niv:'L1'}],
niveau:[{Ref_Niv:'L1'},{Ref_Niv:'L2'}],
periode:[{Annee:'2025-2026'}],
noter:[{Num_El:'E01',Code_Mat:'M102',Annee:'2025-2026',Note:12},{Num_El:'E01',Code_Mat:'M103',Annee:'2025-2026',Note:10},{Num_El:'E02',Code_Mat:'M101',Annee:'2025-2026',Note:7},{Num_El:'E02',Code_Mat:'M102',Annee:'2025-2026',Note:8},{Num_El:'E02',Code_Mat:'M103',Annee:'2025-2026',Note:9},{Num_El:'E01',Code_Mat:'M101',Annee:'2025-2026',Note:14}]
};
const definitions={eleve:{pk:'Num_El',fields:['Num_El','Nom_El','Age','Ref_Niv']},matiere:{pk:'Code_Mat',fields:['Code_Mat','Design','Coeff','Ref_Niv']},niveau:{pk:'Ref_Niv',fields:['Ref_Niv']},periode:{pk:'Annee',fields:['Annee']}};
function copy(value){return JSON.parse(JSON.stringify(value))}
function load(){try{const value=localStorage.getItem(storageKey);if(value)return JSON.parse(value)}catch{}const value=copy(initial);localStorage.setItem(storageKey,JSON.stringify(value));return value}
function save(data){localStorage.setItem(storageKey,JSON.stringify(data))}
function fail(message,status=400){throw Object.assign(new Error(message),{status})}
function rounded(value){return Number(value.toFixed(2))}
function bulletin(data,num,year){
 const eleve=data.eleve.find(item=>item.Num_El===num);if(!eleve)fail('Élève introuvable.',404);
 const notes=data.matiere.filter(item=>item.Ref_Niv===eleve.Ref_Niv).sort((a,b)=>a.Code_Mat.localeCompare(b.Code_Mat)).map(matiere=>{const note=data.noter.find(item=>item.Num_El===num&&item.Code_Mat===matiere.Code_Mat&&item.Annee===year);return{Code_Mat:matiere.Code_Mat,Design:matiere.Design,Coeff:matiere.Coeff,Note:note?.Note??null,Total_Point:note?matiere.Coeff*note.Note:null}});
 const recorded=notes.filter(note=>note.Note!==null),totalCoeff=recorded.reduce((sum,note)=>sum+note.Coeff,0),totalPoints=recorded.reduce((sum,note)=>sum+note.Total_Point,0),raw=totalCoeff?totalPoints/totalCoeff:null,complete=notes.length>0&&recorded.length===notes.length;
 return{eleve,annee:year,notes,totalCoeff,totalPoints:rounded(totalPoints),moyenne:raw===null?null:rounded(raw),complete,observation:!complete?'Incomplet':raw>=10?'Admis':'Ajourné'}
}
function validateNote(data,note){
 if(typeof note.Note!=='number'||!Number.isFinite(note.Note)||note.Note<0||note.Note>20)fail('La note doit être comprise entre 0 et 20.');
 if(!data.periode.some(item=>item.Annee===note.Annee))fail('Référence introuvable : '+note.Annee+'.',404);
 const eleve=data.eleve.find(item=>item.Num_El===note.Num_El),matiere=data.matiere.find(item=>item.Code_Mat===note.Code_Mat);
 if(!eleve||!matiere||eleve.Ref_Niv!==matiere.Ref_Niv)fail('La matière doit appartenir au niveau de l’élève.')
}
async function request(path,method='GET',body={}){
 const data=load(),parts=path.split('/').filter(Boolean).map(decodeURIComponent),[type,id,third,fourth]=parts;
 if(type==='bulletin'&&method==='GET')return bulletin(data,id,third);
 if((type==='resultats'||type==='admis')&&method==='GET'){
  if(!data.periode.some(item=>item.Annee===id))fail('Référence introuvable : '+id+'.',404);
  const rows=[];for(const eleve of data.eleve.slice().sort((a,b)=>a.Nom_El.localeCompare(b.Nom_El))){const report=bulletin(data,eleve.Num_El,id);if(type==='resultats'||report.observation==='Admis')rows.push({...eleve,Moyenne:report.moyenne,Observation:report.observation,complete:report.complete,notesSaisies:report.notes.filter(note=>note.Note!==null).length,notesAttendues:report.notes.length})}return rows
 }
 if(type==='noter'){
  if(method==='GET')return data.noter;
  if(method==='POST'){
   const notes=id==='batch'?body.notes:[body];if(!Array.isArray(notes)||!notes.length||notes.length>500)fail('Choisissez entre 1 et 500 notes.');notes.forEach(note=>validateNote(data,note));
   for(const note of notes){const index=data.noter.findIndex(item=>item.Num_El===note.Num_El&&item.Code_Mat===note.Code_Mat&&item.Annee===note.Annee);if(index<0)data.noter.push(note);else data.noter[index]=note}save(data);return{message:'Notes enregistrées.'}
  }
  if(method==='DELETE'){data.noter=data.noter.filter(note=>!(note.Num_El===id&&note.Code_Mat===third&&note.Annee===fourth));save(data);return{message:'Note supprimée.'}}
  fail('Opération non disponible.',405)
 }
 const definition=definitions[type];if(!definition)fail('Route introuvable.',404);
 const{pk,fields}=definition;
 if(method==='GET')return data[type].slice().sort((a,b)=>String(a[pk]).localeCompare(String(b[pk])));
 if(method==='POST'||method==='PUT'){
  const values={};for(const field of fields){values[field]=String(body[field]??'').trim();if(!values[field]||values[field].length>120)fail('Veuillez renseigner correctement le champ '+field+'.')}
  if(type==='eleve'){values.Age=Number(body.Age);if(!Number.isInteger(values.Age)||values.Age<1||values.Age>120)fail('L’âge doit être un entier entre 1 et 120.');if(!data.niveau.some(item=>item.Ref_Niv===values.Ref_Niv))fail('Référence introuvable : '+values.Ref_Niv+'.',404)}
  if(type==='matiere'){values.Coeff=Number(body.Coeff);if(!Number.isFinite(values.Coeff)||values.Coeff<=0||values.Coeff>100)fail('Le coefficient doit être supérieur à 0 et inférieur ou égal à 100.');if(!data.niveau.some(item=>item.Ref_Niv===values.Ref_Niv))fail('Référence introuvable : '+values.Ref_Niv+'.',404)}
  if(method==='POST'){
   if(data[type].some(item=>item[pk]===values[pk]))fail('Cet identifiant existe déjà. Utilisez Modifier.',409);data[type].push(values)
  }else{
   const index=data[type].findIndex(item=>item[pk]===id);if(index<0)fail('Référence introuvable : '+id+'.',404);
   if(type==='niveau'||type==='periode'){
    if(id!==values[pk]){if(data[type].some(item=>item[pk]===values[pk]))fail('Cet identifiant existe déjà.',409);if(type==='niveau'){data.eleve.forEach(item=>{if(item.Ref_Niv===id)item.Ref_Niv=values[pk]});data.matiere.forEach(item=>{if(item.Ref_Niv===id)item.Ref_Niv=values[pk]})}else data.noter.forEach(item=>{if(item.Annee===id)item.Annee=values[pk]});data[type].splice(index,1);data[type].push(values)}
   }else{
    if(values[pk]!==id)fail('L’identifiant ne peut pas être modifié.');if(values.Ref_Niv!==data[type][index].Ref_Niv&&data.noter.some(note=>note[pk]===id))fail('Supprimez d’abord les notes associées avant de changer de niveau.',409);data[type][index]={...data[type][index],...values}
   }
  }
  save(data);return{message:'Enregistrement effectué.'}
 }
 if(method==='DELETE'){
  const index=data[type].findIndex(item=>item[pk]===id);if(index<0)fail('Référence introuvable : '+id+'.',404);
  const inUse=type==='niveau'?data.eleve.some(item=>item.Ref_Niv===id)||data.matiere.some(item=>item.Ref_Niv===id):type==='periode'?data.noter.some(item=>item.Annee===id):data.noter.some(item=>item[pk]===id);
  if(inUse)fail('Suppression impossible : des données sont encore associées à cet élément.',409);data[type].splice(index,1);save(data);return{message:'Suppression effectuée.'}
 }
 fail('Opération non disponible.',405)
}
window.NoteoLocalApi={request};
})();