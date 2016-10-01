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
			console.log(story.data);
			return story.data;
		})
	}

	storyFactory.fetchUserStories = function(userId) {
		return $http.get(baseUrl + 'user/' + userId)
		.then(function (stories) {
			console.log(stories.data);
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

	storyFactory.updateStory = function(story) {
		return $http.put(baseUrl + story.id, story)
		.then(function (updatedStory) {
			return updatedStory.data;
		})
	}

	storyFactory.read = function(text) {
		return $http.get('http://api.voicerss.org/?key=2e714518e6ba46dd9c4872900e88255c&hl=en-us&src=' + text)
		.then (function (song) {
			return song.data;
		})
		.then( function(songToPlay) {
			console.log(songToPlay)
			
		})
	}



	return storyFactory;

})