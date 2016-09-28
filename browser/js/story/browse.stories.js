app.config(function ($stateProvider) {
    $stateProvider.state('browseStories', {
        url: '/browse',
        templateUrl: 'js/story/browse-stories.html',
        controller: 'BrowseStoriesCtrl',
        resolve: {
        	authors: function(UserFactory) {
        		return UserFactory.fetchAll();
        	}
        }
    });
});

app.controller('BrowseStoriesCtrl', function($scope, authors) {
	$scope.authors = authors.filter(function(author) {
        return author.stories.length;
    })
    
    $scope.stories = [];
    $scope.authors.forEach(function(writer) {
        writer.stories.forEach(function(story) {
            story.author = writer.name;
            story.authorId = writer.id;
            $scope.stories.push(story);
        })
    })
    
    var genres = ['Science Fiction', 'Realistic Fiction', 'Nonfiction', 'Fantasy', 'Romance', 'Travel', 'Children', 'Horror'];
    $scope.genres = [];
    for (var i = 0; i < genres.length; i++) {
        $scope.genres.push($scope.stories.filter(function(story) {
            return story.genre === genres[i];
        }))
    }
    
});