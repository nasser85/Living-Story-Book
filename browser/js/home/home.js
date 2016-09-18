app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeCtrl',
        resolve: {
        	users: function(UserFactory) {
        		return UserFactory.fetchAll();
        	}
        }
    });
});

app.controller('HomeCtrl', function($scope, users, $interval) {
	console.log(users);
    
})