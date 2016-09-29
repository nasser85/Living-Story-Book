'use strict';

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'slick']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

app.directive('account', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/account/account.html'
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('author', {
        url: '/author/:authorId',
        templateUrl: 'js/author/author.html',
        controller: 'AuthorCtrl',
        resolve: {
            author: function author(UserFactory, $stateParams) {
                return UserFactory.fetchById($stateParams.authorId);
            }
        }
    });
});

app.controller('AuthorCtrl', function ($scope, author) {
    $scope.author = author;
})(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('create', {
        url: '/create',
        templateUrl: 'js/create/create.html',
        controller: 'CreateCtrl',
        resolve: {
            user: function user(AuthService) {
                return AuthService.getLoggedInUser();
            }
        }
    });
});

app.controller('CreateCtrl', function ($scope, StoryFactory, $state, user) {
    $scope.messages = ["select a genre for your new story", "design the cover of your story book", "design your book's pages"];
    $scope.newStory = {
        title: "My New Story",
        status: "incomplete",
        cover_url: "not-available.jpg",
        genre: "none",
        userId: 1,
        pages: null
    };
    $scope.pos = 0;
    $scope.author = "anonymous";
    if (user) {
        $scope.author = user.name;
        $scope.newStory.userId = user.id;
    }

    $scope.images = [];
    for (var i = 0; i < 136; i++) {

        $scope.images.push(i.toString() + '.png');
    }

    $scope.pages = [{
        image_url: "not-available.jpg",
        content: ""
    }];

    $scope.genres = [{
        type: 'Science Fiction',
        image: 'science-fiction.jpg'
    }, {
        type: 'Realistic Fiction',
        image: 'realistic-fiction.jpg'
    }, {
        type: 'Nonfiction',
        image: 'nonfiction.jpg'
    }, {
        type: 'Fantasy',
        image: 'fantasy.jpg'
    }, {
        type: 'Romance',
        image: 'romance.jpg'
    }, {
        type: 'Travel',
        image: 'travel.jpg'
    }, {
        type: 'Children',
        image: 'children.jpg'
    }, {
        type: 'Horror',
        image: 'adult.jpg'
    }];

    $scope.selectGenre = function (genre) {
        $scope.newStory.genre = genre;
        console.log($scope.newStory.genre);
        $scope.pos++;
        window.scroll(0, 0);
    };

    $scope.goBack = function () {
        $scope.pos--;
    };
    $scope.nextPage = function () {
        $scope.pos++;
    };

    $scope.submitTitle = function () {
        $scope.pos++;
        window.scroll(0, 0);
    };
    $scope.submitPage = function () {
        $scope.pages.push({ image_url: "not-available.jpg", content: '' });
        $scope.pos = $scope.pages.length + 1;
        window.scroll(0, 0);
    };
    $scope.selectCover = function (url) {
        $scope.newStory.cover_url = url;
    };
    $scope.selectPageImage = function (url) {
        $scope.pages[$scope.pos - 2].image_url = url;
    };
    $scope.publish = function () {
        $scope.newStory.status = "published";
        $scope.newStory.pages = $scope.pages;
        StoryFactory.publishStory($scope.newStory);
    };
    // $scope.publish = function() {
    // 	StoryFactory.publishStory()
    // 	.then(function(publishedStory) {
    // 		if (publishedStory) {
    // 			$state.go('story', {storyId: publishedStory.id })
    // 		}

    // 	});
    // }

    $scope.deletePage = function () {
        $scope.pages.splice($scope.pos - 2, 1);
        $scope.pos--;
    };
});
app.directive('greeting', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/greeting/greeting.html'
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeCtrl',
        resolve: {
            users: function users(UserFactory) {
                return UserFactory.fetchAll();
            },
            user: function user(AuthService) {
                return AuthService.getLoggedInUser();
            }
        }
    });
});

app.controller('HomeCtrl', function ($scope, users, $interval, user) {
    console.log(users);
    $scope.user = user;
    //console.log(user);
    console.log("here it is", $scope.user);
});
app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('browseStories', {
        url: '/browse',
        templateUrl: 'js/story/browse-stories.html',
        controller: 'BrowseStoriesCtrl',
        resolve: {
            authors: function authors(UserFactory) {
                return UserFactory.fetchAll();
            }
        }
    });
});

app.controller('BrowseStoriesCtrl', function ($scope, authors) {
    $scope.authors = authors.filter(function (author) {
        return author.stories.length;
    });

    $scope.stories = [];
    $scope.authors.forEach(function (writer) {
        writer.stories.forEach(function (story) {
            story.author = writer.name;
            story.authorId = writer.id;
            $scope.stories.push(story);
        });
    });

    var genres = ['Science Fiction', 'Realistic Fiction', 'Nonfiction', 'Fantasy', 'Romance', 'Travel', 'Children', 'Horror'];
    $scope.genres = [];
    for (var i = 0; i < genres.length; i++) {
        $scope.genres.push($scope.stories.filter(function (story) {
            return story.genre === genres[i];
        }));
    }
});
app.config(function ($stateProvider) {
    $stateProvider.state('singleStory', {
        url: '/story/:storyId',
        templateUrl: 'js/story/single-story.html',
        controller: 'SingleStoryCtrl',
        resolve: {
            story: function story(StoryFactory, $stateParams) {
                return StoryFactory.fetchById($stateParams.storyId);
            },
            author: function author(UserFactory, story) {
                return UserFactory.fetchById(story.userId);
            }
        }
    });
});

app.controller('SingleStoryCtrl', function ($scope, StoryFactory, story, author) {
    $scope.author = author;
    $scope.newStory = story;
    $scope.pages = story.pages;
    console.log('here is the single story: ', story);
    var voice = window.speechSynthesis;

    $scope.readAloud = function (text) {

        voice.cancel();
        var msg = new SpeechSynthesisUtterance(text);
        voice.speak(msg);
    };
});
app.factory('StoryFactory', function ($http, $state) {
    var storyFactory = {};
    var baseUrl = "/api/stories/";

    storyFactory.fetchPublished = function () {
        return $http.get(baseUrl).then(function (publishedStories) {
            return publishedStories.data;
        });
    };

    storyFactory.fetchAll = function () {
        return $http.get(baseUrl + 'all').then(function (allStories) {
            return allStories.data;
        });
    };

    storyFactory.fetchById = function (storyId) {
        return $http.get(baseUrl + 'story/' + storyId).then(function (story) {
            console.log(story.data);
            return story.data;
        });
    };

    storyFactory.publishStory = function (story) {
        return $http.post(baseUrl, story).then(function (publishedStory) {
            // console.log('here it is: ', publishedStory)

            return publishedStory.data;
        }).then(function (story) {
            console.log(story);
            $state.go('singleStory', { storyId: story.id });
        });
    };

    storyFactory.updateStory = function (story) {
        return $http.put(baseUrl + story.id, story).then(function (updatedStory) {
            return updatedStory.data;
        });
    };

    storyFactory.read = function (text) {
        return $http.get('http://api.voicerss.org/?key=2e714518e6ba46dd9c4872900e88255c&hl=en-us&src=' + text).then(function (song) {
            return song.data;
        }).then(function (songToPlay) {
            console.log(songToPlay);
        });
    };

    return storyFactory;
});
app.factory('UserFactory', function ($http, $state) {
    var userFactory = {};
    var baseUrl = "/api/users/";

    userFactory.fetchById = function (userId) {
        return $http.get(baseUrl + userId).then(function (user) {
            return user.data;
        });
    };

    userFactory.fetchAll = function () {
        return $http.get(baseUrl).then(function (users) {
            return users.data;
        });
    };

    return userFactory;
});
app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.', 'Gimme 3 mins... I just grabbed this really dope frittata', 'If Cooper could offer only one piece of advice, it would be to nevSQUIRREL!'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('browseStories');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImNyZWF0ZS9jcmVhdGUuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsInN0b3J5L2Jyb3dzZS5zdG9yaWVzLmpzIiwic3Rvcnkvc2luZ2xlLnN0b3J5LmpzIiwic3Rvcnkvc3RvcnkuZmFjdG9yeS5qcyIsInVzZXIvdXNlci5mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJ0ZW1wbGF0ZVVybCIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwiY29udHJvbGxlciIsInJlc29sdmUiLCJhdXRob3IiLCJVc2VyRmFjdG9yeSIsIiRzdGF0ZVBhcmFtcyIsImZldGNoQnlJZCIsImF1dGhvcklkIiwiJHNjb3BlIiwiRXJyb3IiLCJmYWN0b3J5IiwiaW8iLCJvcmlnaW4iLCJjb25zdGFudCIsImxvZ2luU3VjY2VzcyIsImxvZ2luRmFpbGVkIiwibG9nb3V0U3VjY2VzcyIsInNlc3Npb25UaW1lb3V0Iiwibm90QXV0aGVudGljYXRlZCIsIm5vdEF1dGhvcml6ZWQiLCIkcSIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCJyZXNwb25zZSIsIiRicm9hZGNhc3QiLCJzdGF0dXMiLCJyZWplY3QiLCIkaHR0cFByb3ZpZGVyIiwiaW50ZXJjZXB0b3JzIiwicHVzaCIsIiRpbmplY3RvciIsImdldCIsInNlcnZpY2UiLCIkaHR0cCIsIlNlc3Npb24iLCJvblN1Y2Nlc3NmdWxMb2dpbiIsImNyZWF0ZSIsImlkIiwiZnJvbVNlcnZlciIsImNhdGNoIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJTdG9yeUZhY3RvcnkiLCJtZXNzYWdlcyIsIm5ld1N0b3J5IiwidGl0bGUiLCJjb3Zlcl91cmwiLCJnZW5yZSIsInVzZXJJZCIsInBhZ2VzIiwicG9zIiwiaW1hZ2VzIiwiaSIsInRvU3RyaW5nIiwiaW1hZ2VfdXJsIiwiY29udGVudCIsImdlbnJlcyIsInR5cGUiLCJpbWFnZSIsInNlbGVjdEdlbnJlIiwiY29uc29sZSIsImxvZyIsInNjcm9sbCIsImdvQmFjayIsIm5leHRQYWdlIiwic3VibWl0VGl0bGUiLCJzdWJtaXRQYWdlIiwibGVuZ3RoIiwic2VsZWN0Q292ZXIiLCJzZWxlY3RQYWdlSW1hZ2UiLCJwdWJsaXNoIiwicHVibGlzaFN0b3J5IiwiZGVsZXRlUGFnZSIsInNwbGljZSIsInVzZXJzIiwiZmV0Y2hBbGwiLCIkaW50ZXJ2YWwiLCJlcnJvciIsInNlbmRMb2dpbiIsImxvZ2luSW5mbyIsImF1dGhvcnMiLCJmaWx0ZXIiLCJzdG9yaWVzIiwiZm9yRWFjaCIsIndyaXRlciIsInN0b3J5Iiwic3RvcnlJZCIsInZvaWNlIiwic3BlZWNoU3ludGhlc2lzIiwicmVhZEFsb3VkIiwidGV4dCIsImNhbmNlbCIsIm1zZyIsIlNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSIsInNwZWFrIiwic3RvcnlGYWN0b3J5IiwiYmFzZVVybCIsImZldGNoUHVibGlzaGVkIiwicHVibGlzaGVkU3RvcmllcyIsImFsbFN0b3JpZXMiLCJwdWJsaXNoZWRTdG9yeSIsInVwZGF0ZVN0b3J5IiwicHV0IiwidXBkYXRlZFN0b3J5IiwicmVhZCIsInNvbmciLCJzb25nVG9QbGF5IiwidXNlckZhY3RvcnkiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNBRix1QkFBQUcsU0FBQSxDQUFBLEdBQUE7QUFDQTtBQUNBSCx1QkFBQUksSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBVCxlQUFBVSxRQUFBLENBQUFDLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7QUFXQTtBQUNBVixJQUFBVyxH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QUE7O0FBRUEsV0FBQTtBQUNBbEksa0JBQUEsR0FEQTtBQUVBQyxxQkFBQSx5REFGQTtBQUdBNkgsY0FBQSxjQUFBRCxLQUFBLEVBQUE7QUFDQUEsa0JBQUFNLFFBQUEsR0FBQUQsZ0JBQUFOLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnc2xpY2snXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FjY291bnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hY2NvdW50L2FjY291bnQuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aG9yJywge1xuICAgICAgICB1cmw6ICcvYXV0aG9yLzphdXRob3JJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYXV0aG9yL2F1dGhvci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0F1dGhvckN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YXV0aG9yOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5hdXRob3JJZCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0F1dGhvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcikge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xufSkiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY3JlYXRlL2NyZWF0ZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ3JlYXRlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCAkc3RhdGUsIHVzZXIpIHtcblx0JHNjb3BlLm1lc3NhZ2VzID0gW1wic2VsZWN0IGEgZ2VucmUgZm9yIHlvdXIgbmV3IHN0b3J5XCIsIFwiZGVzaWduIHRoZSBjb3ZlciBvZiB5b3VyIHN0b3J5IGJvb2tcIiwgXCJkZXNpZ24geW91ciBib29rJ3MgcGFnZXNcIl1cblx0JHNjb3BlLm5ld1N0b3J5ID0ge1xuXHRcdHRpdGxlOiBcIk15IE5ldyBTdG9yeVwiLFxuXHRcdHN0YXR1czogXCJpbmNvbXBsZXRlXCIsXG5cdFx0Y292ZXJfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0Z2VucmU6IFwibm9uZVwiLFxuXHRcdHVzZXJJZDogMSxcblx0XHRwYWdlczogbnVsbFxuXHR9XG5cdCRzY29wZS5wb3MgPSAwO1xuXHQkc2NvcGUuYXV0aG9yID0gXCJhbm9ueW1vdXNcIlxuXHRpZiAodXNlcikge1xuXHRcdCRzY29wZS5hdXRob3IgPSB1c2VyLm5hbWU7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnVzZXJJZCA9IHVzZXIuaWQ7IFxuXHR9XG5cdFxuXHQkc2NvcGUuaW1hZ2VzID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgMTM2OyBpKyspIHtcblxuXHRcdCRzY29wZS5pbWFnZXMucHVzaChpLnRvU3RyaW5nKCkgKyAnLnBuZycpO1xuXHR9XG5cdFxuXG5cdCRzY29wZS5wYWdlcyA9IFtcblx0XHR7XG5cdFx0XHRpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRcdGNvbnRlbnQ6IFwiXCJcblx0XHR9XG5cdF07XG5cblx0JHNjb3BlLmdlbnJlcyA9IFtcblx0XHR7XG5cdFx0XHR0eXBlOiAnU2NpZW5jZSBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAnc2NpZW5jZS1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUmVhbGlzdGljIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdyZWFsaXN0aWMtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ05vbmZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdub25maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnRmFudGFzeScsXG5cdFx0XHRpbWFnZTogJ2ZhbnRhc3kuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSb21hbmNlJyxcblx0XHRcdGltYWdlOiAncm9tYW5jZS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1RyYXZlbCcsXG5cdFx0XHRpbWFnZTogJ3RyYXZlbC5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0NoaWxkcmVuJyxcblx0XHRcdGltYWdlOiAnY2hpbGRyZW4uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdIb3Jyb3InLFxuXHRcdFx0aW1hZ2U6ICdhZHVsdC5qcGcnLFxuXHRcdH1cblx0XTtcblxuXHQkc2NvcGUuc2VsZWN0R2VucmUgPSBmdW5jdGlvbihnZW5yZSkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5nZW5yZSA9IGdlbnJlO1xuXHRcdGNvbnNvbGUubG9nKCRzY29wZS5uZXdTdG9yeS5nZW5yZSk7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuZ29CYWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxuXHQkc2NvcGUubmV4dFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHR9XG5cblx0JHNjb3BlLnN1Ym1pdFRpdGxlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblx0JHNjb3BlLnN1Ym1pdFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMucHVzaCh7aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsIGNvbnRlbnQ6ICcnfSk7XG5cdFx0JHNjb3BlLnBvcyA9ICRzY29wZS5wYWdlcy5sZW5ndGggKyAxO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuY292ZXJfdXJsID0gdXJsO1xuXHR9XG5cdCRzY29wZS5zZWxlY3RQYWdlSW1hZ2UgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUucGFnZXNbJHNjb3BlLnBvcy0yXS5pbWFnZV91cmwgPSB1cmw7XG5cdH1cblx0JHNjb3BlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUubmV3U3Rvcnkuc3RhdHVzID0gXCJwdWJsaXNoZWRcIjtcblx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdH1cblx0Ly8gJHNjb3BlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcblx0Ly8gXHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KClcblx0Ly8gXHQudGhlbihmdW5jdGlvbihwdWJsaXNoZWRTdG9yeSkge1xuXHQvLyBcdFx0aWYgKHB1Ymxpc2hlZFN0b3J5KSB7XG5cdC8vIFx0XHRcdCRzdGF0ZS5nbygnc3RvcnknLCB7c3RvcnlJZDogcHVibGlzaGVkU3RvcnkuaWQgfSlcblx0Ly8gXHRcdH1cblx0XHRcdFxuXHQvLyBcdH0pO1xuXHQvLyB9XG5cblx0JHNjb3BlLmRlbGV0ZVBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMuc3BsaWNlKCRzY29wZS5wb3MtMiwgMSk7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnZ3JlZXRpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ncmVldGluZy9ncmVldGluZy5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdIb21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgdXNlcnMsICRpbnRlcnZhbCwgdXNlcikge1xuXHRjb25zb2xlLmxvZyh1c2Vycyk7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyXG4gICAgLy9jb25zb2xlLmxvZyh1c2VyKTtcbiAgICBjb25zb2xlLmxvZyhcImhlcmUgaXQgaXNcIiwgJHNjb3BlLnVzZXIpXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYnJvd3NlU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2Jyb3dzZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3RvcnkvYnJvd3NlLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdCcm93c2VTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Jyb3dzZVN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3JzKSB7XG5cdCRzY29wZS5hdXRob3JzID0gYXV0aG9ycy5maWx0ZXIoZnVuY3Rpb24oYXV0aG9yKSB7XG4gICAgICAgIHJldHVybiBhdXRob3Iuc3Rvcmllcy5sZW5ndGg7XG4gICAgfSlcbiAgICBcbiAgICAkc2NvcGUuc3RvcmllcyA9IFtdO1xuICAgICRzY29wZS5hdXRob3JzLmZvckVhY2goZnVuY3Rpb24od3JpdGVyKSB7XG4gICAgICAgIHdyaXRlci5zdG9yaWVzLmZvckVhY2goZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvciA9IHdyaXRlci5uYW1lO1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9ySWQgPSB3cml0ZXIuaWQ7XG4gICAgICAgICAgICAkc2NvcGUuc3Rvcmllcy5wdXNoKHN0b3J5KTtcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIFxuICAgIHZhciBnZW5yZXMgPSBbJ1NjaWVuY2UgRmljdGlvbicsICdSZWFsaXN0aWMgRmljdGlvbicsICdOb25maWN0aW9uJywgJ0ZhbnRhc3knLCAnUm9tYW5jZScsICdUcmF2ZWwnLCAnQ2hpbGRyZW4nLCAnSG9ycm9yJ107XG4gICAgJHNjb3BlLmdlbnJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VucmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICRzY29wZS5nZW5yZXMucHVzaCgkc2NvcGUuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yeS5nZW5yZSA9PT0gZ2VucmVzW2ldO1xuICAgICAgICB9KSlcbiAgICB9XG4gICAgXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTdG9yeScsIHtcbiAgICAgICAgdXJsOiAnL3N0b3J5LzpzdG9yeUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9zaW5nbGUtc3RvcnkuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaW5nbGVTdG9yeUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0c3Rvcnk6IGZ1bmN0aW9uKFN0b3J5RmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU3RvcnlGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuc3RvcnlJZCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIGF1dGhvcjogZnVuY3Rpb24oVXNlckZhY3RvcnksIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZChzdG9yeS51c2VySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpbmdsZVN0b3J5Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCBzdG9yeSwgYXV0aG9yKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG4gICAgJHNjb3BlLm5ld1N0b3J5ID0gc3Rvcnk7XG4gICAgJHNjb3BlLnBhZ2VzID0gc3RvcnkucGFnZXM7XG4gICAgY29uc29sZS5sb2coJ2hlcmUgaXMgdGhlIHNpbmdsZSBzdG9yeTogJywgc3RvcnkpO1xuICAgIHZhciB2b2ljZSA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgXG4gICAgJHNjb3BlLnJlYWRBbG91ZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICAgICAgICB2b2ljZS5jYW5jZWwoKTtcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UodGV4dCk7XG4gICAgICAgIHZvaWNlLnNwZWFrKG1zZyk7XG4gICAgfVxufSk7IiwiYXBwLmZhY3RvcnkoJ1N0b3J5RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUpe1xuXHR2YXIgc3RvcnlGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3N0b3JpZXMvXCI7XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoUHVibGlzaGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnYWxsJylcblx0XHQudGhlbihmdW5jdGlvbiAoYWxsU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIGFsbFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uKHN0b3J5SWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnc3RvcnkvJyArIHN0b3J5SWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzdG9yeS5kYXRhKTtcblx0XHRcdHJldHVybiBzdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdChiYXNlVXJsLCBzdG9yeSlcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3RvcnkpIHtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCdoZXJlIGl0IGlzOiAnLCBwdWJsaXNoZWRTdG9yeSlcblx0XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3RvcnkuZGF0YVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzdG9yeSk7XG5cdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZVN0b3J5Jywge3N0b3J5SWQ6IHN0b3J5LmlkfSlcblx0XHR9KVxuXHRcdFxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucHV0KGJhc2VVcmwgKyBzdG9yeS5pZCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVwZGF0ZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHVwZGF0ZWRTdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucmVhZCA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCdodHRwOi8vYXBpLnZvaWNlcnNzLm9yZy8/a2V5PTJlNzE0NTE4ZTZiYTQ2ZGQ5YzQ4NzI5MDBlODgyNTVjJmhsPWVuLXVzJnNyYz0nICsgdGV4dClcblx0XHQudGhlbiAoZnVuY3Rpb24gKHNvbmcpIHtcblx0XHRcdHJldHVybiBzb25nLmRhdGE7XG5cdFx0fSlcblx0XHQudGhlbiggZnVuY3Rpb24oc29uZ1RvUGxheSkge1xuXHRcdFx0Y29uc29sZS5sb2coc29uZ1RvUGxheSlcblx0XHRcdFxuXHRcdH0pXG5cdH1cblxuXG5cblx0cmV0dXJuIHN0b3J5RmFjdG9yeTtcblxufSkiLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHVzZXJGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3VzZXJzL1wiO1xuXG5cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdHJldHVybiB1c2VyLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuXHRcdFx0cmV0dXJuIHVzZXJzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiB1c2VyRmFjdG9yeTtcbn0pOyIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdicm93c2VTdG9yaWVzJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
