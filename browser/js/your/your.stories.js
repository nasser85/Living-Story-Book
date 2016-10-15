app.config(function ($stateProvider) {
    $stateProvider.state('yourStories', {
        url: '/yourstories',
        templateUrl: 'js/your/your-stories.html',
        controller: 'YourStoriesCtrl',
        resolve: {
        	user: function(AuthService) {
        		return AuthService.getLoggedInUser();
        	}
        }
    });
});

app.controller('YourStoriesCtrl', function($scope, user, $rootScope, $state, AuthService) {
	
    if ($rootScope.pageUpdate) {
        window.location.reload();
        $rootScope.pageUpdate = false;
    }
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
    
    $scope.user = user;
    $scope.publishedStories = $scope.user.stories.filter(function(story) {
        return story.status === 'published';
    })
    $scope.unfinishedStories = $scope.user.stories.filter(function(story) {
        return story.status !== 'published';
    })

    $scope.resume = function(story) {
        $rootScope.story = story;
    }
});