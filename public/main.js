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
});
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
    for (var i = 0; i < 267; i++) {

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
(function () {

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
    $scope.user = user;
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

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
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

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsInN0b3J5L2Jyb3dzZS5zdG9yaWVzLmpzIiwic3Rvcnkvc2luZ2xlLnN0b3J5LmpzIiwic3Rvcnkvc3RvcnkuZmFjdG9yeS5qcyIsInVzZXIvdXNlci5mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJ0ZW1wbGF0ZVVybCIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwiY29udHJvbGxlciIsInJlc29sdmUiLCJhdXRob3IiLCJVc2VyRmFjdG9yeSIsIiRzdGF0ZVBhcmFtcyIsImZldGNoQnlJZCIsImF1dGhvcklkIiwiJHNjb3BlIiwiU3RvcnlGYWN0b3J5IiwibWVzc2FnZXMiLCJuZXdTdG9yeSIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJwYWdlcyIsInBvcyIsImlkIiwiaW1hZ2VzIiwiaSIsInB1c2giLCJ0b1N0cmluZyIsImltYWdlX3VybCIsImNvbnRlbnQiLCJnZW5yZXMiLCJ0eXBlIiwiaW1hZ2UiLCJzZWxlY3RHZW5yZSIsImNvbnNvbGUiLCJsb2ciLCJzY3JvbGwiLCJnb0JhY2siLCJuZXh0UGFnZSIsInN1Ym1pdFRpdGxlIiwic3VibWl0UGFnZSIsImxlbmd0aCIsInNlbGVjdENvdmVyIiwic2VsZWN0UGFnZUltYWdlIiwicHVibGlzaCIsInB1Ymxpc2hTdG9yeSIsImRlbGV0ZVBhZ2UiLCJzcGxpY2UiLCJFcnJvciIsImZhY3RvcnkiLCJpbyIsIm9yaWdpbiIsImNvbnN0YW50IiwibG9naW5TdWNjZXNzIiwibG9naW5GYWlsZWQiLCJsb2dvdXRTdWNjZXNzIiwic2Vzc2lvblRpbWVvdXQiLCJub3RBdXRoZW50aWNhdGVkIiwibm90QXV0aG9yaXplZCIsIiRxIiwiQVVUSF9FVkVOVFMiLCJzdGF0dXNEaWN0IiwicmVzcG9uc2VFcnJvciIsInJlc3BvbnNlIiwiJGJyb2FkY2FzdCIsInJlamVjdCIsIiRodHRwUHJvdmlkZXIiLCJpbnRlcmNlcHRvcnMiLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwiY2F0Y2giLCJsb2dpbiIsImNyZWRlbnRpYWxzIiwicG9zdCIsIm1lc3NhZ2UiLCJsb2dvdXQiLCJkZXN0cm95Iiwic2VsZiIsInNlc3Npb25JZCIsInVzZXJzIiwiZmV0Y2hBbGwiLCIkaW50ZXJ2YWwiLCJlcnJvciIsInNlbmRMb2dpbiIsImxvZ2luSW5mbyIsImF1dGhvcnMiLCJmaWx0ZXIiLCJzdG9yaWVzIiwiZm9yRWFjaCIsIndyaXRlciIsInN0b3J5Iiwic3RvcnlJZCIsInZvaWNlIiwic3BlZWNoU3ludGhlc2lzIiwicmVhZEFsb3VkIiwidGV4dCIsImNhbmNlbCIsIm1zZyIsIlNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSIsInNwZWFrIiwic3RvcnlGYWN0b3J5IiwiYmFzZVVybCIsImZldGNoUHVibGlzaGVkIiwicHVibGlzaGVkU3RvcmllcyIsImFsbFN0b3JpZXMiLCJwdWJsaXNoZWRTdG9yeSIsInVwZGF0ZVN0b3J5IiwicHV0IiwidXBkYXRlZFN0b3J5IiwicmVhZCIsInNvbmciLCJzb25nVG9QbGF5IiwidXNlckZhY3RvcnkiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNBRix1QkFBQUcsU0FBQSxDQUFBLEdBQUE7QUFDQTtBQUNBSCx1QkFBQUksSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBVCxlQUFBVSxRQUFBLENBQUFDLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7QUFXQTtBQUNBVixJQUFBVyxH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QTtBQVFBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdzbGljayddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWNjb3VudCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FjY291bnQvYWNjb3VudC5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRob3InLCB7XG4gICAgICAgIHVybDogJy9hdXRob3IvOmF1dGhvcklkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hdXRob3IvYXV0aG9yLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXV0aG9yQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmF1dGhvcklkKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQXV0aG9yQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgYXV0aG9yKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY3JlYXRlL2NyZWF0ZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ3JlYXRlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCAkc3RhdGUsIHVzZXIpIHtcblx0JHNjb3BlLm1lc3NhZ2VzID0gW1wic2VsZWN0IGEgZ2VucmUgZm9yIHlvdXIgbmV3IHN0b3J5XCIsIFwiZGVzaWduIHRoZSBjb3ZlciBvZiB5b3VyIHN0b3J5IGJvb2tcIiwgXCJkZXNpZ24geW91ciBib29rJ3MgcGFnZXNcIl1cblx0JHNjb3BlLm5ld1N0b3J5ID0ge1xuXHRcdHRpdGxlOiBcIk15IE5ldyBTdG9yeVwiLFxuXHRcdHN0YXR1czogXCJpbmNvbXBsZXRlXCIsXG5cdFx0Y292ZXJfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0Z2VucmU6IFwibm9uZVwiLFxuXHRcdHVzZXJJZDogMSxcblx0XHRwYWdlczogbnVsbFxuXHR9XG5cdCRzY29wZS5wb3MgPSAwO1xuXHQkc2NvcGUuYXV0aG9yID0gXCJhbm9ueW1vdXNcIlxuXHRpZiAodXNlcikge1xuXHRcdCRzY29wZS5hdXRob3IgPSB1c2VyLm5hbWU7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnVzZXJJZCA9IHVzZXIuaWQ7IFxuXHR9XG5cdFxuXHQkc2NvcGUuaW1hZ2VzID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgMjY3OyBpKyspIHtcblxuXHRcdCRzY29wZS5pbWFnZXMucHVzaChpLnRvU3RyaW5nKCkgKyAnLnBuZycpO1xuXHR9XG5cdFxuXG5cdCRzY29wZS5wYWdlcyA9IFtcblx0XHR7XG5cdFx0XHRpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRcdGNvbnRlbnQ6IFwiXCJcblx0XHR9XG5cdF07XG5cblx0JHNjb3BlLmdlbnJlcyA9IFtcblx0XHR7XG5cdFx0XHR0eXBlOiAnU2NpZW5jZSBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAnc2NpZW5jZS1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUmVhbGlzdGljIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdyZWFsaXN0aWMtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ05vbmZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdub25maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnRmFudGFzeScsXG5cdFx0XHRpbWFnZTogJ2ZhbnRhc3kuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSb21hbmNlJyxcblx0XHRcdGltYWdlOiAncm9tYW5jZS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1RyYXZlbCcsXG5cdFx0XHRpbWFnZTogJ3RyYXZlbC5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0NoaWxkcmVuJyxcblx0XHRcdGltYWdlOiAnY2hpbGRyZW4uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdIb3Jyb3InLFxuXHRcdFx0aW1hZ2U6ICdhZHVsdC5qcGcnLFxuXHRcdH1cblx0XTtcblxuXHQkc2NvcGUuc2VsZWN0R2VucmUgPSBmdW5jdGlvbihnZW5yZSkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5nZW5yZSA9IGdlbnJlO1xuXHRcdGNvbnNvbGUubG9nKCRzY29wZS5uZXdTdG9yeS5nZW5yZSk7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuZ29CYWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxuXHQkc2NvcGUubmV4dFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHR9XG5cblx0JHNjb3BlLnN1Ym1pdFRpdGxlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblx0JHNjb3BlLnN1Ym1pdFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMucHVzaCh7aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsIGNvbnRlbnQ6ICcnfSk7XG5cdFx0JHNjb3BlLnBvcyA9ICRzY29wZS5wYWdlcy5sZW5ndGggKyAxO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuY292ZXJfdXJsID0gdXJsO1xuXHR9XG5cdCRzY29wZS5zZWxlY3RQYWdlSW1hZ2UgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUucGFnZXNbJHNjb3BlLnBvcy0yXS5pbWFnZV91cmwgPSB1cmw7XG5cdH1cblx0JHNjb3BlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUubmV3U3Rvcnkuc3RhdHVzID0gXCJwdWJsaXNoZWRcIjtcblx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdH1cblx0Ly8gJHNjb3BlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcblx0Ly8gXHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KClcblx0Ly8gXHQudGhlbihmdW5jdGlvbihwdWJsaXNoZWRTdG9yeSkge1xuXHQvLyBcdFx0aWYgKHB1Ymxpc2hlZFN0b3J5KSB7XG5cdC8vIFx0XHRcdCRzdGF0ZS5nbygnc3RvcnknLCB7c3RvcnlJZDogcHVibGlzaGVkU3RvcnkuaWQgfSlcblx0Ly8gXHRcdH1cblx0XHRcdFxuXHQvLyBcdH0pO1xuXHQvLyB9XG5cblx0JHNjb3BlLmRlbGV0ZVBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMuc3BsaWNlKCRzY29wZS5wb3MtMiwgMSk7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncmVldGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2dyZWV0aW5nL2dyZWV0aW5nLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXJzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VycywgJGludGVydmFsLCB1c2VyKSB7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYnJvd3NlU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2Jyb3dzZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3RvcnkvYnJvd3NlLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdCcm93c2VTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Jyb3dzZVN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3JzKSB7XG5cdCRzY29wZS5hdXRob3JzID0gYXV0aG9ycy5maWx0ZXIoZnVuY3Rpb24oYXV0aG9yKSB7XG4gICAgICAgIHJldHVybiBhdXRob3Iuc3Rvcmllcy5sZW5ndGg7XG4gICAgfSlcbiAgICBcbiAgICAkc2NvcGUuc3RvcmllcyA9IFtdO1xuICAgICRzY29wZS5hdXRob3JzLmZvckVhY2goZnVuY3Rpb24od3JpdGVyKSB7XG4gICAgICAgIHdyaXRlci5zdG9yaWVzLmZvckVhY2goZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvciA9IHdyaXRlci5uYW1lO1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9ySWQgPSB3cml0ZXIuaWQ7XG4gICAgICAgICAgICAkc2NvcGUuc3Rvcmllcy5wdXNoKHN0b3J5KTtcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIFxuICAgIHZhciBnZW5yZXMgPSBbJ1NjaWVuY2UgRmljdGlvbicsICdSZWFsaXN0aWMgRmljdGlvbicsICdOb25maWN0aW9uJywgJ0ZhbnRhc3knLCAnUm9tYW5jZScsICdUcmF2ZWwnLCAnQ2hpbGRyZW4nLCAnSG9ycm9yJ107XG4gICAgJHNjb3BlLmdlbnJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VucmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICRzY29wZS5nZW5yZXMucHVzaCgkc2NvcGUuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yeS5nZW5yZSA9PT0gZ2VucmVzW2ldO1xuICAgICAgICB9KSlcbiAgICB9XG4gICAgXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTdG9yeScsIHtcbiAgICAgICAgdXJsOiAnL3N0b3J5LzpzdG9yeUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9zaW5nbGUtc3RvcnkuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaW5nbGVTdG9yeUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0c3Rvcnk6IGZ1bmN0aW9uKFN0b3J5RmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU3RvcnlGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuc3RvcnlJZCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIGF1dGhvcjogZnVuY3Rpb24oVXNlckZhY3RvcnksIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZChzdG9yeS51c2VySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpbmdsZVN0b3J5Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCBzdG9yeSwgYXV0aG9yKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG4gICAgJHNjb3BlLm5ld1N0b3J5ID0gc3Rvcnk7XG4gICAgJHNjb3BlLnBhZ2VzID0gc3RvcnkucGFnZXM7XG4gICAgY29uc29sZS5sb2coJ2hlcmUgaXMgdGhlIHNpbmdsZSBzdG9yeTogJywgc3RvcnkpO1xuICAgIHZhciB2b2ljZSA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgXG4gICAgJHNjb3BlLnJlYWRBbG91ZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICAgICAgICB2b2ljZS5jYW5jZWwoKTtcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UodGV4dCk7XG4gICAgICAgIHZvaWNlLnNwZWFrKG1zZyk7XG4gICAgfVxufSk7IiwiYXBwLmZhY3RvcnkoJ1N0b3J5RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUpe1xuXHR2YXIgc3RvcnlGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3N0b3JpZXMvXCI7XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoUHVibGlzaGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnYWxsJylcblx0XHQudGhlbihmdW5jdGlvbiAoYWxsU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIGFsbFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uKHN0b3J5SWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnc3RvcnkvJyArIHN0b3J5SWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzdG9yeS5kYXRhKTtcblx0XHRcdHJldHVybiBzdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdChiYXNlVXJsLCBzdG9yeSlcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3RvcnkpIHtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCdoZXJlIGl0IGlzOiAnLCBwdWJsaXNoZWRTdG9yeSlcblx0XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3RvcnkuZGF0YVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzdG9yeSk7XG5cdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZVN0b3J5Jywge3N0b3J5SWQ6IHN0b3J5LmlkfSlcblx0XHR9KVxuXHRcdFxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucHV0KGJhc2VVcmwgKyBzdG9yeS5pZCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVwZGF0ZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHVwZGF0ZWRTdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucmVhZCA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCdodHRwOi8vYXBpLnZvaWNlcnNzLm9yZy8/a2V5PTJlNzE0NTE4ZTZiYTQ2ZGQ5YzQ4NzI5MDBlODgyNTVjJmhsPWVuLXVzJnNyYz0nICsgdGV4dClcblx0XHQudGhlbiAoZnVuY3Rpb24gKHNvbmcpIHtcblx0XHRcdHJldHVybiBzb25nLmRhdGE7XG5cdFx0fSlcblx0XHQudGhlbiggZnVuY3Rpb24oc29uZ1RvUGxheSkge1xuXHRcdFx0Y29uc29sZS5sb2coc29uZ1RvUGxheSlcblx0XHRcdFxuXHRcdH0pXG5cdH1cblxuXG5cblx0cmV0dXJuIHN0b3J5RmFjdG9yeTtcblxufSkiLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHVzZXJGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3VzZXJzL1wiO1xuXG5cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdHJldHVybiB1c2VyLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuXHRcdFx0cmV0dXJuIHVzZXJzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiB1c2VyRmFjdG9yeTtcbn0pOyIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYnJvd3NlU3RvcmllcycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
