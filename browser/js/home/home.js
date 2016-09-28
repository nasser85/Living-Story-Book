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
	console.log(users);
    $scope.user = user
    //console.log(user);
    console.log("here it is", $scope.user)
})