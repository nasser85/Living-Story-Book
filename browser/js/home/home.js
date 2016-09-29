app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeCtrl',
        resolve: {
        	users: function(UserFactory) {
        		return UserFactory.fetchAll();
        	},
            user: function(AuthService) {
                return AuthService.getLoggedInUser();
            }
        }
    });
});

app.controller('HomeCtrl', function($scope, users, $interval, user) {
    $scope.user = user
})