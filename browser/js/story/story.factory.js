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

	storyFactory.publishStory = function(story) {
		return $http.post(baseUrl, story)
		.then(function (publishedStory) {
			// console.log('here it is: ', publishedStory)
	
			return publishedStory.data
		})
		.then(function (story) {
			console.log(story);
			$state.go('singleStory', {storyId: story.id})
		})
		
	}

	storyFactory.updateStory = function(story) {
		return $http.put(baseUrl + story.id, story)
		.then(function (updatedStory) {
			return updatedStory.data;
		})
	}



	return storyFactory;

})