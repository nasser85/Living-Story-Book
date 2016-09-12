app.factory('UserFactory', function($http, $state){
	var userFactory = {};
	var baseUrl = "/api/users/";



	userFactory.fetchById = function(userId) {
		return $http.get(baseUrl + userId)
		.then(function (user) {
			return user.data;
		})
	}

	userFactory.fetchAll = function() {
		return $http.get(baseUrl)
		.then(function (users) {
			return users.data;
		})
	}

	return userFactory;
});