const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

// Vérification et création du dossier processed si nécessaire
const processedDir = path.join('images', 'processed');
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

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

  // Définir un nouveau chemin pour le fichier traité
  const outputFilePath = path.join(processedDir, 'processed_' + Date.now() + path.extname(filePath));
  console.log(`Enregistrement dans : ${outputFilePath}`);

  // Traitement de l'image avec sharp
  sharp(filePath)
    .resize(100) //redimensionne
    .toFormat(MIME_TYPES[req.file.mimetype]) // Garde le format original
    .toFile(outputFilePath, (err, info) => {
      if (err) {
        console.error('Erreur de traitement de l\'image:', err);
        return res.status(500).json({ error: 'Erreur de traitement de l\'image' });
      }
      console.log("Traitement réussi:", info);
      req.file.path = outputFilePath; // Met à jour le chemin du fichier traité
      next(); // Passe au prochain middleware
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
