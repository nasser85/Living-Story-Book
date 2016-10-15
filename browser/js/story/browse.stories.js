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
    $scope.breakpoints = [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
            infinite: true,
            dots: true
          }
        },
        {
          breakpoint: 700,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
    }];
    $scope.stories = [];
    $scope.authors.forEach(function(writer) {
        writer.stories.forEach(function(story) {
            story.author = writer.name;
            story.authorId = writer.id;
            if (story.status === 'published') {
               $scope.stories.push(story); 
            }
            
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