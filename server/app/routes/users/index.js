'use strict';
const router = require('express').Router();
const db = require('../../../db');
const User = db.model('user');
const Story = db.model('story');
const Page = db.model('page');

module.exports = router;

router.get('/', function (req, res, next) {
	User.findAll()
	.then(function (foundUsers) {
		res.send(foundUsers);
	})
	.catch(next);
});

router.get('/:id', function (req, res, next) {
	User.findOne({
		where: {
			id: req.params.id
		}
	})
	.then(function (foundUser) {
		res.send(foundUser);
	})
	.catch(next);
});

