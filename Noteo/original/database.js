const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./notes.db');

db.serialize(() => {
    // 1. Déclaration des tables
    db.run(`CREATE TABLE IF NOT EXISTS NIVEAU (
        Ref_Niv TEXT PRIMARY KEY
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ELEVE (
        Num_El TEXT PRIMARY KEY,
        Nom_El TEXT NOT NULL,
        Age INTEGER,
        Ref_Niv TEXT,
        FOREIGN KEY (Ref_Niv) REFERENCES NIVEAU(Ref_Niv) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS MATIERE (
        Code_Mat TEXT PRIMARY KEY,
        Design TEXT NOT NULL,
        Coeff REAL CHECK(Coeff > 0),
        Ref_Niv TEXT,
        FOREIGN KEY (Ref_Niv) REFERENCES NIVEAU(Ref_Niv) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS PERIODE (
        Annee TEXT PRIMARY KEY
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS NOTER (
        Num_El TEXT,
        Code_Mat TEXT,
        Annee TEXT,
        Note REAL CHECK(Note >= 0 AND Note <= 20),
        PRIMARY KEY (Num_El, Code_Mat, Annee),
        FOREIGN KEY (Num_El) REFERENCES ELEVE(Num_El) ON DELETE CASCADE,
        FOREIGN KEY (Code_Mat) REFERENCES MATIERE(Code_Mat) ON DELETE CASCADE,
        FOREIGN KEY (Annee) REFERENCES PERIODE(Annee) ON DELETE CASCADE
    )`);

    // 2. Insertion des données fictives pour les tests
    db.get("SELECT COUNT(*) AS count FROM NIVEAU", (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO NIVEAU VALUES ('L1'), ('L2')");

            db.run("INSERT INTO PERIODE VALUES ('2025-2026')");

            db.run("INSERT INTO ELEVE VALUES ('E01', 'Rakoto Jean', 19, 'L1')");
            db.run("INSERT INTO ELEVE VALUES ('E02', 'Rabe Marie', 20, 'L1')");
            db.run("INSERT INTO ELEVE VALUES ('E03', 'Randria Paul', 18, 'L1')");

            db.run("INSERT INTO MATIERE VALUES ('M101', 'Algorithmique', 4, 'L1')");
            db.run("INSERT INTO MATIERE VALUES ('M102', 'Bases de Données', 3, 'L1')");
            db.run("INSERT INTO MATIERE VALUES ('M103', 'Anglais', 2, 'L1')");

            // Notes de Rakoto Jean (Admis : Moyenne >= 10)
            db.run("INSERT INTO NOTER VALUES ('E01', 'M101', '2025-2026', 14)");
            db.run("INSERT INTO NOTER VALUES ('E01', 'M102', '2025-2026', 12)");
            db.run("INSERT INTO NOTER VALUES ('E01', 'M103', '2025-2026', 10)");

            // Notes de Rabe Marie (Ajourné : Moyenne < 10)
            db.run("INSERT INTO NOTER VALUES ('E02', 'M101', '2025-2026', 07)");
            db.run("INSERT INTO NOTER VALUES ('E02', 'M102', '2025-2026', 08)");
            db.run("INSERT INTO NOTER VALUES ('E02', 'M103', '2025-2026', 09)");

            console.log("Données fictives insérées avec succès.");
        }
    });
});

module.exports = db;