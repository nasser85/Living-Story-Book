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
            },
            user: function(AuthService) {
                return AuthService.getLoggedInUser();
            }
        }
    });
});

app.controller('SingleStoryCtrl', function($scope, StoryFactory, story, author, user, $rootScope) {
	$scope.author = author;
    $scope.newStory = story;
    $scope.pages = story.pages;
    $scope.message = null;
    $scope.deletability = function() {
        if (user.id === author.id || user.google_id === "105690537679974787001") {
            return true;
        } 
        return false;
        
    }
    var voice = window.speechSynthesis;
    
    $scope.deleteStory = function(story) {
        window.scroll(0, 0);
        if ($scope.message !== "Deleting book...") {
            if (!$scope.message) {
                $scope.message = "Are you sure you want to delete this book?";
            } else {
                $scope.message = "Deleting book...";
                $rootScope.pageUpdate = true;
                StoryFactory.delete(story);
            }
        } 
    }
    $scope.cancelDelete = function() {
        $scope.message = null;
    }
    $scope.readAloud = function(text) {

        voice.cancel();
        var msg = new SpeechSynthesisUtterance(text);
        voice.speak(msg);
    }

});