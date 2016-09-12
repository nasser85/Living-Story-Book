'use strict';
var Sequelize = require('sequelize');

var db = require('../_db');

module.exports = db.define('page', {
    page_number: Sequelize.INTEGER,
    image_url: Sequelize.STRING,
    content: Sequelize.TEXT,
    background_color: Sequelize.STRING
});