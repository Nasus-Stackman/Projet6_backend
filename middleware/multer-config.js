const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

// Configuration du stockage avec multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images'); // Dossier où les images seront stockées
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_'); // Remplacer les espaces par des underscores
    const extension = MIME_TYPES[file.mimetype]; // Extension de l'image
    callback(null, name + Date.now() + '.' + extension); // Nouveau nom de fichier
  }
});

// Middleware d'upload avec multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de taille de fichier, exemple : 10MB
}).single('image');

// Middleware pour le traitement avec sharp pendant l'upload
const processImage = (req, res, next) => {
  console.log("Traitement de l'image en cours...");
  if (!req.file) {
    console.log("Aucun fichier trouvé.");
    return next(); // Si aucun fichier n'est envoyé, passer au middleware suivant
  }

  const filePath = req.file.path; // Chemin vers le fichier temporaire
  console.log(`Fichier trouvé : ${filePath}`);

  // Traitement de l'image avec sharp
  sharp(filePath)
    .resize(400) //redimensionne
    .toFormat(MIME_TYPES[req.file.mimetype]) // Garde le format original
    .toBuffer() // Utilisation de toBuffer pour obtenir l'image traitée dans la mémoire
    .then((data) => {
      // Supprimer le fichier original après traitement
      fs.unlinkSync(filePath); // Supprime l'image originale dans 'images'

      // Enregistrer l'image traitée dans le même dossier avec le même nom
      fs.writeFileSync(filePath, data); // Écrit l'image traitée dans 'images'

      console.log("Traitement réussi. Fichier mis à jour dans images.");
      next(); // Passe au prochain middleware
    })
    .catch((err) => {
      console.error('Erreur de traitement de l\'image:', err);
      return res.status(500).json({ error: 'Erreur de traitement de l\'image' });
    });
};

// Fonction exportée qui combine upload et traitement
const handleImageUpload = (req, res, next) => {
  console.log("Début de l'upload de l'image...");
  upload(req, res, (err) => {
    if (err) {
      console.error("Erreur d'upload de l'image:", err);
      return res.status(400).json({ error: 'Erreur d\'upload de l\'image' });
    }
    console.log("Upload réussi...");
    processImage(req, res, next);
  });
};

module.exports = handleImageUpload;

