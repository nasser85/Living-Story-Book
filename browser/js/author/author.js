app.config(function ($stateProvider) {
    $stateProvider.state('author', {
        url: '/author/:authorId',
        templateUrl: 'js/author/author.html',
        controller: 'AuthorCtrl',
        resolve: {
        	authorUser: function(UserFactory, $stateParams) {
        		return UserFactory.fetchById($stateParams.authorId);
        	}
        }
    });
});

app.controller('AuthorCtrl', function($scope, authorUser) {
	document.body.style.background = "url(background.jpg)";
    document.body.style.backgroundRepeat = "repeat";
    document.body.style.backgroundAttachment = "fixed";
    $scope.author = authorUser;
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
});