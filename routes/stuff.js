const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stuffCtrl = require('../controllers/stuff');
const multer = require('../middleware/multer-config');


router.get('/', stuffCtrl.getAllBooks);

router.get('/:id', stuffCtrl.getOneBook);

router.get('/bestrating', stuffCtrl.getThreeBooks)

router.post('/', auth, multer, stuffCtrl.createBook);

router.put('/:id', auth, multer, stuffCtrl.modifyBook);

router.delete('/:id', auth, stuffCtrl.deleteBook);

module.exports = router