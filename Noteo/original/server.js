const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// -------------------------------------------------------------
// TRAVAIL À FAIRE 1°/ : Bulletin de notes d'un élève
// -------------------------------------------------------------
app.get('/api/bulletin/:numEl/:annee', (req, res) => {
    const { numEl, annee } = req.params;

    const sqlEleve = `SELECT E.Num_El, E.Nom_El, E.Age, E.Ref_Niv 
                      FROM ELEVE E WHERE E.Num_El = ?`;

    const sqlNotes = `SELECT M.Code_Mat, M.Design, M.Coeff, N.Note, (M.Coeff * N.Note) AS Total_Point
                      FROM NOTER N
                      JOIN MATIERE M ON N.Code_Mat = M.Code_Mat
                      WHERE N.Num_El = ? AND N.Annee = ?`;

    db.get(sqlEleve, [numEl], (err, eleve) => {
        if (err || !eleve) return res.status(404).json({ error: "Élève introuvable." });

        db.all(sqlNotes, [numEl, annee], (err, notes) => {
            if (err) return res.status(500).json({ error: err.message });

            let totalCoeff = 0;
            let totalPoints = 0;

            notes.forEach(row => {
                totalCoeff += row.Coeff;
                totalPoints += row.Total_Point;
            });

            const moyenne = totalCoeff > 0 ? (totalPoints / totalCoeff) : 0;
            const observation = moyenne >= 10 ? "Admis" : "Ajourné";

            res.json({
                eleve,
                annee,
                notes,
                totalCoeff,
                totalPoints: parseFloat(totalPoints.toFixed(2)),
                moyenne: parseFloat(moyenne.toFixed(2)),
                observation
            });
        });
    });
});

// -------------------------------------------------------------
// TRAVAIL À FAIRE 2°/ : Liste des admis (RG4 et RG5)
// -------------------------------------------------------------
app.get('/api/admis/:annee', (req, res) => {
    const { annee } = req.params;
    
    const sql = `
        SELECT E.Num_El, E.Nom_El, E.Ref_Niv,
               SUM(M.Coeff * N.Note) / SUM(M.Coeff) AS Moyenne,
               CASE 
                   WHEN (SUM(M.Coeff * N.Note) / SUM(M.Coeff)) >= 10 THEN 'Admis'
                   ELSE 'Ajourné'
               END AS Observation
        FROM ELEVE E
        JOIN NOTER N ON E.Num_El = N.Num_El
        JOIN MATIERE M ON N.Code_Mat = M.Code_Mat
        WHERE N.Annee = ?
        GROUP BY E.Num_El
        HAVING Moyenne >= 10
    `;

    db.all(sql, [annee], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// -------------------------------------------------------------
// TRAVAIL À FAIRE 3°/ : Opérations CRUD pour chaque fichier
// -------------------------------------------------------------

// HELPER GENÉRIQUE CRUD
const createCRUDEndpoints = (table, pk) => {
    // Read All
    app.get(`/api/${table.toLowerCase()}`, (req, res) => {
        db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });

    // Delete
    app.delete(`/api/${table.toLowerCase()}/:id`, (req, res) => {
        db.run(`DELETE FROM ${table} WHERE ${pk} = ?`, [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Suppression effectuée", changes: this.changes });
        });
    });
};

createCRUDEndpoints('NIVEAU', 'Ref_Niv');
createCRUDEndpoints('ELEVE', 'Num_El');
createCRUDEndpoints('MATIERE', 'Code_Mat');
createCRUDEndpoints('PERIODE', 'Annee');

// Create / Update ELEVE
app.post('/api/eleve', (req, res) => {
    const { Num_El, Nom_El, Age, Ref_Niv } = req.body;
    const sql = `INSERT INTO ELEVE (Num_El, Nom_El, Age, Ref_Niv) VALUES (?, ?, ?, ?)
                 ON CONFLICT(Num_El) DO UPDATE SET Nom_El=?, Age=?, Ref_Niv=?`;
    db.run(sql, [Num_El, Nom_El, Age, Ref_Niv, Nom_El, Age, Ref_Niv], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Élève enregistré/mis à jour avec succès" });
    });
});

// Create / Update MATIERE
app.post('/api/matiere', (req, res) => {
    const { Code_Mat, Design, Coeff, Ref_Niv } = req.body;
    const sql = `INSERT INTO MATIERE (Code_Mat, Design, Coeff, Ref_Niv) VALUES (?, ?, ?, ?)
                 ON CONFLICT(Code_Mat) DO UPDATE SET Design=?, Coeff=?, Ref_Niv=?`;
    db.run(sql, [Code_Mat, Design, Coeff, Ref_Niv, Design, Coeff, Ref_Niv], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Matière enregistrée/mise à jour avec succès" });
    });
});

// CRUD Spécifique TABLE NOTER
app.get('/api/noter', (req, res) => {
    db.all(`SELECT * FROM NOTER`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/noter', (req, res) => {
    const { Num_El, Code_Mat, Annee, Note } = req.body;
    const sql = `INSERT INTO NOTER (Num_El, Code_Mat, Annee, Note) VALUES (?, ?, ?, ?)
                 ON CONFLICT(Num_El, Code_Mat, Annee) DO UPDATE SET Note=?`;
    db.run(sql, [Num_El, Code_Mat, Annee, Note, Note], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "Note enregistrée" });
    });
});

app.delete('/api/noter/:numEl/:codeMat/:annee', (req, res) => {
    const { numEl, codeMat, annee } = req.params;
    db.run(`DELETE FROM NOTER WHERE Num_El=? AND Code_Mat=? AND Annee=?`, [numEl, codeMat, annee], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Note supprimée", changes: this.changes });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});