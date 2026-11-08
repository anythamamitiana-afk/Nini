const API_URL = 'http://localhost:3000/api';

// 1°/ Générer le Bulletin
async function genererBulletin() {
    const numEl = document.getElementById('bulletin-num').value;
    const annee = document.getElementById('bulletin-annee').value;
    const resContainer = document.getElementById('bulletin-result');

    if (!numEl || !annee) return alert("Veuillez saisir le N° élève et l'année.");

    const response = await fetch(`${API_URL}/bulletin/${numEl}/${annee}`);
    if (!response.ok) {
        resContainer.innerHTML = `<p style="color:red;">Aucune donnée trouvée.</p>`;
        return;
    }
    const data = await response.json();

    let html = `
        <hr>
        <h3>Bulletin de Notes - Année : ${data.annee}</h3>
        <p><strong>N° Élève:</strong> ${data.eleve.Num_El} | <strong>Nom:</strong> ${data.eleve.Nom_El} | <strong>Niveau:</strong> ${data.eleve.Ref_Niv}</p>
        <table>
            <tr><th>Matière</th><th>Coefficient</th><th>Note / 20</th><th>Points</th></tr>
    `;

    data.notes.forEach(n => {
        html += `<tr><td>${n.Design}</td><td>${n.Coeff}</td><td>${n.Note}</td><td>${n.Total_Point}</td></tr>`;
    });

    const statusClass = data.observation === "Admis" ? "admis" : "ajourne";

    html += `
        <tr><th>TOTAL</th><th>${data.totalCoeff}</th><th>-</th><th>${data.totalPoints}</th></tr>
        </table>
        <p><strong>Moyenne Générale :</strong> ${data.moyenne} / 20</p>
        <p><strong>Observation :</strong> <span class="${statusClass}">${data.observation}</span></p>
    `;

    resContainer.innerHTML = html;
}

// 2°/ Charger la Liste des Admis
async function chargerAdmis() {
    const annee = document.getElementById('admis-annee').value;
    const tbody = document.querySelector('#table-admis tbody');
    tbody.innerHTML = '';

    const response = await fetch(`${API_URL}/admis/${annee}`);
    const data = await response.json();

    data.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${item.Num_El}</td>
                <td>${item.Nom_El}</td>
                <td>${item.Ref_Niv}</td>
                <td>${item.Moyenne.toFixed(2)}</td>
                <td class="admis">${item.Observation}</td>
            </tr>
        `;
    });
}

// 3°/ Gestion CRUD Élèves
async function chargerEleves() {
    const tbody = document.querySelector('#table-eleves tbody');
    tbody.innerHTML = '';
    const response = await fetch(`${API_URL}/eleve`);
    const eleves = await response.json();

    eleves.forEach(el => {
        tbody.innerHTML += `
            <tr>
                <td>${el.Num_El}</td>
                <td>${el.Nom_El}</td>
                <td>${el.Age}</td>
                <td>${el.Ref_Niv}</td>
                <td>
                    <button class="btn-danger" onclick="supprimerEleve('${el.Num_El}')">Supprimer</button>
                </td>
            </tr>
        `;
    });
}

async function sauvegarderEleve(e) {
    e.preventDefault();
    const eleve = {
        Num_El: document.getElementById('el-num').value,
        Nom_El: document.getElementById('el-nom').value,
        Age: parseInt(document.getElementById('el-age').value),
        Ref_Niv: document.getElementById('el-niv').value
    };

    await fetch(`${API_URL}/eleve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eleve)
    });

    document.getElementById('form-eleve').reset();
    chargerEleves();
}

async function supprimerEleve(id) {
    if (confirm(`Voulez-vous supprimer l'élève ${id} ?`)) {
        await fetch(`${API_URL}/eleve/${id}`, { method: 'DELETE' });
        chargerEleves();
    }
}

// Chargement initial au démarrage
window.onload = () => {
    chargerEleves();
};