CREATE TABLE NIVEAU (
        Ref_Niv TEXT PRIMARY KEY
    );
--> statement-breakpoint
CREATE TABLE ELEVE (
        Num_El TEXT PRIMARY KEY,
        Nom_El TEXT NOT NULL,
        Age INTEGER,
        Ref_Niv TEXT,
        FOREIGN KEY (Ref_Niv) REFERENCES NIVEAU(Ref_Niv) ON DELETE CASCADE
    );
--> statement-breakpoint
CREATE TABLE MATIERE (
        Code_Mat TEXT PRIMARY KEY,
        Design TEXT NOT NULL,
        Coeff REAL CHECK(Coeff > 0),
        Ref_Niv TEXT,
        FOREIGN KEY (Ref_Niv) REFERENCES NIVEAU(Ref_Niv) ON DELETE CASCADE
    );
--> statement-breakpoint
CREATE TABLE PERIODE (
        Annee TEXT PRIMARY KEY
    );
--> statement-breakpoint
CREATE TABLE NOTER (
        Num_El TEXT,
        Code_Mat TEXT,
        Annee TEXT,
        Note REAL CHECK(Note >= 0 AND Note <= 20),
        PRIMARY KEY (Num_El, Code_Mat, Annee),
        FOREIGN KEY (Num_El) REFERENCES ELEVE(Num_El) ON DELETE CASCADE,
        FOREIGN KEY (Code_Mat) REFERENCES MATIERE(Code_Mat) ON DELETE CASCADE,
        FOREIGN KEY (Annee) REFERENCES PERIODE(Annee) ON DELETE CASCADE
    );
--> statement-breakpoint
CREATE TABLE _site_seed (id INTEGER PRIMARY KEY);