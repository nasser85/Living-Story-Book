app.config(function ($stateProvider) {
    $stateProvider.state('singleStory', {
        url: '/story/:storyId',
        templateUrl: 'js/story/single-story.html',
        controller: 'SingleStoryCtrl',
        resolve: {
        	story: function(StoryFactory, $stateParams) {
        		return StoryFactory.fetchById($stateParams.storyId);
        	}
        }
    });
});

app.controller('SingleStoryCtrl', function($scope, StoryFactory, story) {
	console.log('here is the single story: ', story);
});