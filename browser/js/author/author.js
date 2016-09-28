app.config(function ($stateProvider) {
    $stateProvider.state('author', {
        url: '/author/:authorId',
        templateUrl: 'js/author/author.html',
        controller: 'AuthorCtrl',
        resolve: {
        	author: function(UserFactory, $stateParams) {
        		return UserFactory.fetchById($stateParams.authorId);
        	}
        }
    });
});

app.controller('AuthorCtrl', function($scope, author) {
	$scope.author = author;
})