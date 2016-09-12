app.config(function ($stateProvider) {
    $stateProvider.state('singleStory', {
        url: '/story/:storyId',
        templateUrl: 'js/story/single-story.html',
        controller: 'SingleStoryCtrl',
        resolve: {
        	story: function(StoryFactory, $stateParams) {
        		return StoryFactory.fetchById($stateParams.storyId);
        	},
            author: function(UserFactory, story) {
                return UserFactory.fetchById(story.userId);
            }
        }
    });
});

app.controller('SingleStoryCtrl', function($scope, StoryFactory, story, author) {
	$scope.author = author.name;
    $scope.newStory = story;
    $scope.pages = story.pages;
    console.log('here is the single story: ', story);
});