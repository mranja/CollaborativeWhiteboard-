const express = require('express');
const router = express.Router();
const boardCtrl = require('../controllers/boardController');
const auth = require('../middleware/auth');

router.get('/', auth, boardCtrl.listUserBoards); // List user's boards
router.post('/', auth, boardCtrl.createBoard);
router.get('/:id', auth, boardCtrl.getBoard);
router.get('/:boardId/versions', auth, boardCtrl.getVersions);
router.post('/:boardId/invite', auth, boardCtrl.invite);
router.post('/:boardId/version', auth, boardCtrl.saveVersion);

module.exports = router;
