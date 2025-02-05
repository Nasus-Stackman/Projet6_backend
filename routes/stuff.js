const express = require('express');
const router = express.Router();
const stuffCtrl = require('../controllers/stuff')


router.get('/', stuffCtrl.getAllBooks);

router.get('/:id', stuffCtrl.getOneBook);

router.post('/', stuffCtrl.createBooks );

router.put('/:id', stuffCtrl.modifyBook);

router.delete('/:id', stuffCtrl.deleteBooks);

module.exports = router