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
	$scope.author = authorUser;
})