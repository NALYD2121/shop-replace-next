const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuration CORS
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Route pour servir l'interface utilisateur
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Interface gestionnaire de mods démarrée sur le port ${PORT}`);
}); 