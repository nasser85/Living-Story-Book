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

app.controller('HomeCtrl', function($scope, users, user, $rootScope, $state, AuthService) {
    
    $scope.user = user;
    if ($scope.user) {
        document.body.style.background = "url(background.jpg)";
        document.body.style.backgroundRepeat = "repeat";
        document.body.style.backgroundAttachment = "fixed";
    } else {
        document.body.style.background = "url()";
    }

    $scope.createNew = function() {
        $rootScope.story = null;
    }
    $scope.logout = function() {
        AuthService.logout().then(function () {
            $state.go('browseStories');
        });
    }

})