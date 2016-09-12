'use strict';
var db = require('./_db');
module.exports = db;

var User = require('./models/user');
var Story = require('./models/story');
var Page = require('./models/page');

Story.belongsTo(User);
User.hasMany(Story);

Page.belongsTo(Story);
Story.hasMany(Page);