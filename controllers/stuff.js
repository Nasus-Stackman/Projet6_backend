const { error } = require('console');
const Books = require('../models/books');
const fs = require('fs');
const authMiddleware = require('../middleware/auth'); // pour avoir l'id utilisateur
const { console } = require('inspector');
const path = require('path');

exports.createBook = (req, res, next) => {
    console.log(req.file)
    const bookObject = JSON.parse(req.body.book); // converti du json en js
    console.log(bookObject)
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Books({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    book.save()
        .then(() => { res.status(201).json({ message: 'Objet enregistré !' }) })
        .catch(error => { res.status(400).json({ error }) })
};

exports.modifyBook = (req, res, next) => {
    // Si un fichier est envoyé (nouvelle image), on l'ajoute à l'objet
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject._userId;

    // Cherche le livre dans la base de données
    Books.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                return res.status(401).json({ message: 'Not authorized' });
            } else {
                // Si une nouvelle image est envoyée, on supprime l'ancienne image
                if (req.file) {
                    if (book.imageUrl) {
                        const oldImagePath = path.join('images', book.imageUrl.split('/images/')[1]);
                        fs.unlink(oldImagePath, (err) => {
                            if (err) {
                                console.error('Erreur de suppression de l\'ancienne image:', err);
                            } else {
                                console.log('Ancienne image supprimée avec succès.');
                            }
                        });
                    }
                    // Mettre à jour l'URL de l'image avec la nouvelle image
                    bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
                }

                // Mettre à jour l'objet book dans la base de données
                Books.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet modifié!' }))
                    .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.deleteBook = (req, res, next) => {
    Books.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Books.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

exports.getOneBook = (req, res, next) => {
    Books.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(406).json({ error }));
}

exports.getAllBooks = (req, res, next) => {
    Books.find()
        .then(book => res.status(200).json(book))
        .catch(error => res.status(400).json({ error }))
}

exports.getThreeBooks = (req, res, next) => {
    Books.find()
        .sort({ averageRating: -1 })    // trie décroissant, on ne prend que ce qui nousn intéresse
        .limit(3)
        .then(book => res.status(200).json(book))
        .catch(error => res.status(400).json({ error }))
}

exports.evaluateBook = (req, res, next) => {
    const IDuser = req.auth.userId;
    const note = req.body.rating
    const bookId = req.params.id
    console.log('ID du livre:', bookId);
    console.log(IDuser)
    if (!bookId) {
        return res.status(400).json({ error: 'ID du livre manquant' });
    }
    Books.findOne({ _id: bookId }, 'ratings')  // on peut mettre plusieurs champs, ex =ratings et autre chose
        .then(book => {
            const UserGrade = book.ratings.find(elem => elem.userId === IDuser)  //voir si l'utilisateur a déja noté
            if (UserGrade) {
                return res.status(400).json({ error: 'Vous avez déjà noté ce livre' });
            }
            if (note === undefined) {
                console.log('il faut saisir une note')
            }
            Books.updateOne({ _id: bookId }, { $push: { ratings: { userId: IDuser, grade: note } } })
                .then(() => {
                    const newRatings = [...book.ratings, { userId: IDuser, grade: note }]; // On inclut la nouvelle note
                    const totalGrades = newRatings.reduce((sum, rating) => sum + rating.grade, 0);
                    let averageGrade = totalGrades / newRatings.length;
                    averageGrade = parseFloat(averageGrade.toFixed(2));
                    return Books.updateOne({ _id: bookId }, { $set: { averageRating: averageGrade } });
                })
                .then(() => {
                    return Books.findOne({ _id: req.params.id })
                })
                .then(updatedBook => {
                    return res.status(200).json(updatedBook);
                })
                .catch(error => {
                    return res.status(500).json({ error: 'Erreur lors de l\'ajout de la note' });
                })
        })
        .catch(error => res.status(400).json({ error }))
}