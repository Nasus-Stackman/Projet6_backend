const express = require('express');
const auth = require('../middleware/auth');
const stuffCtrl = require('../controllers/stuff')
const router = express.Router();


router.get('/', auth, stuffCtrl.getAllBooks);

router.get('/:id', auth, stuffCtrl.getOneBook);

router.post('/', auth, stuffCtrl.createBooks );

router.put('/:id', auth, stuffCtrl.modifyBook);

router.delete('/:id', auth, stuffCtrl.deleteBooks);

module.exports = router