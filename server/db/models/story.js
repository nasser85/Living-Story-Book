'use strict';
var Sequelize = require('sequelize');

var db = require('../_db');
var Page = require('./page');

module.exports = db.define('story', {
    title: Sequelize.STRING,
    status: Sequelize.ENUM('incomplete', 'published'),
    cover_url: Sequelize.TEXT,
    genre: Sequelize.ENUM('Science Fiction', 'Realistic Fiction', 'Nonfiction', 'Fantasy', 'Romance', 'Travel', 'Children', 'Adult', 'none')
}, {
	defaultScope: {
		include: [Page]
	}
});