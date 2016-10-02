app.factory('StoryFactory', function($http, $state){
	var storyFactory = {};
	var baseUrl = "/api/stories/";

	storyFactory.fetchPublished = function() {
		return $http.get(baseUrl)
		.then(function (publishedStories) {
			return publishedStories.data;
		})
	}

	storyFactory.fetchAll = function() {
		return $http.get(baseUrl + 'all')
		.then(function (allStories) {
			return allStories.data;
		})
	}

	storyFactory.fetchById = function(storyId) {
		return $http.get(baseUrl + 'story/' + storyId)
		.then(function (story) {
			return story.data;
		})
	}

	storyFactory.fetchUserStories = function(userId) {
		return $http.get(baseUrl + 'user/' + userId)
		.then(function (stories) {
			return stories.data;
		})
	}

	storyFactory.publishStory = function(story) {
		return $http.post(baseUrl, story)
		.then(function (publishedStory) {
			return publishedStory.data
		})
		.then(function (story) {
			$state.go('singleStory', {storyId: story.id})
		})
		
	}

	storyFactory.delete = function(story) {
		return $http.delete(baseUrl + story.id)
		.then(function (deletedStory) {
			return deletedStory.data;
		})
		.then(function(deleted) {
			$state.go('home');
		})
	}

	storyFactory.updateStory = function(story) {
		var currStory = this;
		currStory.delete(story)
		.then(function() {
			return currStory.publishStory(story);
		})
	}

	return storyFactory;

})