'use strict';
const router = require('express').Router();
const db = require('../../../db');
const User = db.model('user');
const Story = db.model('story');
const Page = db.model('page');

module.exports = router;


router.get('/', function (req, res, next) {
	Story.findAll({
		where: {
			status: 'published'
		}
	})
	.then(function (allStories) {
		res.send(allStories);
	})
	.catch(next);
});

router.get('/all', function (req, res, next) {
	Story.findAll()
	.then(function (allStories) {
		res.send(allStories);
	})
	.catch(next);
});

router.get('/user/:userId', function (req, res, next) {
	Story.findAll({
		where: {
			userId: req.params.userId
		}
	})
	.then(function (userStories) {
		res.send(userStories);
	})
	.catch(next);
});

router.get('/story/:storyId', function (req, res, next) {
	Story.findOne({
		where: {
			id: req.params.storyId
		}
	})
	.then(function (foundStory) {
		res.send(foundStory);
	})
	.catch(next);
});

router.post('/', function (req, res, next) {
	Story.create(req.body, {
		include: [Page]
	})
	.then(function (createdStory) {
		res.send(createdStory);
	})
	.catch(next);
});

router.delete('/:storyId', function (req, res, next) {
	Page.findAll({
		where: {
			storyId: req.params.storyId
		}
	})
	.then(function (storyPages) {
		if (storyPages) {
			return storyPages.forEach(function(storyPage) {
				storyPage.destroy()
				.then(function (deletedPage) {
					res.sendStatus(200);
				})
			})
		} else {
			res.sendStatus(404);
		}
		
	})
	.then(function () {
		return Story.findOne({
			where: {
				id: req.params.storyId
			}
		})
		.then(function (story) {
			if (story) {
				return story.destroy()
				.then(function (deletedStory) {
					res.sendStatus(200);
				})
			} else {
				res.sendStatus(404);
			}
		})
	})
	.catch(next);
});
