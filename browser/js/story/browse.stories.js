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
    // $scope.scienceFiction = $scope.stories.filter(function(story) {
    //     return story.genre === "Science Fiction";
    // })
    // $scope.realisticFiction = $scope.stories.filter(function(story) {
    //     return story.genre === "Realistic Fiction";
    // })
    // $scope.nonfiction = $scope.stories.filter(function(story) {
    //     return story.genre === "Nonfiction";
    // })
    // $scope.fantasy = $scope.stories.filter(function(story) {
    //     return story.genre === "Fantasy";
    // })
    // $scope.romance = $scope.stories.filter(function(story) {
    //     return story.genre === "Romance";
    // })
    // $scope.travel = $scope.stories.filter(function(story) {
    //     return story.genre === "Travel";
    // })
    // $scope.children = $scope.stories.filter(function(story) {
    //     return story.genre === "Children";
    // })
    // $scope.horror = $scope.stories.filter(function(story) {
    //     return story.genre === "Horror";
    // })
});