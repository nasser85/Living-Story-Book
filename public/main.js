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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsInVzZXIvdXNlci5mYWN0b3J5LmpzIiwic3RvcnkvYnJvd3NlLnN0b3JpZXMuanMiLCJzdG9yeS9zaW5nbGUuc3RvcnkuanMiLCJzdG9yeS9zdG9yeS5mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJ0ZW1wbGF0ZVVybCIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwiY29udHJvbGxlciIsInJlc29sdmUiLCJhdXRob3IiLCJVc2VyRmFjdG9yeSIsIiRzdGF0ZVBhcmFtcyIsImZldGNoQnlJZCIsImF1dGhvcklkIiwiJHNjb3BlIiwiU3RvcnlGYWN0b3J5IiwibWVzc2FnZXMiLCJuZXdTdG9yeSIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJwYWdlcyIsInBvcyIsImlkIiwiaW1hZ2VzIiwiaSIsInB1c2giLCJ0b1N0cmluZyIsImltYWdlX3VybCIsImNvbnRlbnQiLCJnZW5yZXMiLCJ0eXBlIiwiaW1hZ2UiLCJzZWxlY3RHZW5yZSIsImNvbnNvbGUiLCJsb2ciLCJzY3JvbGwiLCJnb0JhY2siLCJuZXh0UGFnZSIsInN1Ym1pdFRpdGxlIiwic3VibWl0UGFnZSIsImxlbmd0aCIsInNlbGVjdENvdmVyIiwic2VsZWN0UGFnZUltYWdlIiwicHVibGlzaCIsInB1Ymxpc2hTdG9yeSIsImRlbGV0ZVBhZ2UiLCJzcGxpY2UiLCJFcnJvciIsImZhY3RvcnkiLCJpbyIsIm9yaWdpbiIsImNvbnN0YW50IiwibG9naW5TdWNjZXNzIiwibG9naW5GYWlsZWQiLCJsb2dvdXRTdWNjZXNzIiwic2Vzc2lvblRpbWVvdXQiLCJub3RBdXRoZW50aWNhdGVkIiwibm90QXV0aG9yaXplZCIsIiRxIiwiQVVUSF9FVkVOVFMiLCJzdGF0dXNEaWN0IiwicmVzcG9uc2VFcnJvciIsInJlc3BvbnNlIiwiJGJyb2FkY2FzdCIsInJlamVjdCIsIiRodHRwUHJvdmlkZXIiLCJpbnRlcmNlcHRvcnMiLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwiY2F0Y2giLCJsb2dpbiIsImNyZWRlbnRpYWxzIiwicG9zdCIsIm1lc3NhZ2UiLCJsb2dvdXQiLCJkZXN0cm95Iiwic2VsZiIsInNlc3Npb25JZCIsInVzZXJzIiwiZmV0Y2hBbGwiLCIkaW50ZXJ2YWwiLCJlcnJvciIsInNlbmRMb2dpbiIsImxvZ2luSW5mbyIsInVzZXJGYWN0b3J5IiwiYmFzZVVybCIsImF1dGhvcnMiLCJmaWx0ZXIiLCJzdG9yaWVzIiwiZm9yRWFjaCIsIndyaXRlciIsInN0b3J5Iiwic3RvcnlJZCIsInZvaWNlIiwic3BlZWNoU3ludGhlc2lzIiwicmVhZEFsb3VkIiwidGV4dCIsImNhbmNlbCIsIm1zZyIsIlNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSIsInNwZWFrIiwic3RvcnlGYWN0b3J5IiwiZmV0Y2hQdWJsaXNoZWQiLCJwdWJsaXNoZWRTdG9yaWVzIiwiYWxsU3RvcmllcyIsInB1Ymxpc2hlZFN0b3J5IiwidXBkYXRlU3RvcnkiLCJwdXQiLCJ1cGRhdGVkU3RvcnkiLCJyZWFkIiwic29uZyIsInNvbmdUb1BsYXkiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNBRix1QkFBQUcsU0FBQSxDQUFBLEdBQUE7QUFDQTtBQUNBSCx1QkFBQUksSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBVCxlQUFBVSxRQUFBLENBQUFDLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7QUFXQTtBQUNBVixJQUFBVyxH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QUdBNkgsY0FBQSxjQUFBRCxLQUFBLEVBQUE7QUFDQUEsa0JBQUFNLFFBQUEsR0FBQUQsZ0JBQUFOLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnc2xpY2snXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FjY291bnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hY2NvdW50L2FjY291bnQuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aG9yJywge1xuICAgICAgICB1cmw6ICcvYXV0aG9yLzphdXRob3JJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYXV0aG9yL2F1dGhvci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0F1dGhvckN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YXV0aG9yOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5hdXRob3JJZCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0F1dGhvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcikge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjcmVhdGUnLCB7XG4gICAgICAgIHVybDogJy9jcmVhdGUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NyZWF0ZS9jcmVhdGUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDcmVhdGVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NyZWF0ZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgJHN0YXRlLCB1c2VyKSB7XG5cdCRzY29wZS5tZXNzYWdlcyA9IFtcInNlbGVjdCBhIGdlbnJlIGZvciB5b3VyIG5ldyBzdG9yeVwiLCBcImRlc2lnbiB0aGUgY292ZXIgb2YgeW91ciBzdG9yeSBib29rXCIsIFwiZGVzaWduIHlvdXIgYm9vaydzIHBhZ2VzXCJdXG5cdCRzY29wZS5uZXdTdG9yeSA9IHtcblx0XHR0aXRsZTogXCJNeSBOZXcgU3RvcnlcIixcblx0XHRzdGF0dXM6IFwiaW5jb21wbGV0ZVwiLFxuXHRcdGNvdmVyX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdGdlbnJlOiBcIm5vbmVcIixcblx0XHR1c2VySWQ6IDEsXG5cdFx0cGFnZXM6IG51bGxcblx0fVxuXHQkc2NvcGUucG9zID0gMDtcblx0JHNjb3BlLmF1dGhvciA9IFwiYW5vbnltb3VzXCJcblx0aWYgKHVzZXIpIHtcblx0XHQkc2NvcGUuYXV0aG9yID0gdXNlci5uYW1lO1xuXHRcdCRzY29wZS5uZXdTdG9yeS51c2VySWQgPSB1c2VyLmlkOyBcblx0fVxuXHRcblx0JHNjb3BlLmltYWdlcyA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IDEzNjsgaSsrKSB7XG5cblx0XHQkc2NvcGUuaW1hZ2VzLnB1c2goaS50b1N0cmluZygpICsgJy5wbmcnKTtcblx0fVxuXHRcblxuXHQkc2NvcGUucGFnZXMgPSBbXG5cdFx0e1xuXHRcdFx0aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRjb250ZW50OiBcIlwiXG5cdFx0fVxuXHRdO1xuXG5cdCRzY29wZS5nZW5yZXMgPSBbXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1NjaWVuY2UgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3NjaWVuY2UtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JlYWxpc3RpYyBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAncmVhbGlzdGljLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdOb25maWN0aW9uJyxcblx0XHRcdGltYWdlOiAnbm9uZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0ZhbnRhc3knLFxuXHRcdFx0aW1hZ2U6ICdmYW50YXN5LmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUm9tYW5jZScsXG5cdFx0XHRpbWFnZTogJ3JvbWFuY2UuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdUcmF2ZWwnLFxuXHRcdFx0aW1hZ2U6ICd0cmF2ZWwuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdDaGlsZHJlbicsXG5cdFx0XHRpbWFnZTogJ2NoaWxkcmVuLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnSG9ycm9yJyxcblx0XHRcdGltYWdlOiAnYWR1bHQuanBnJyxcblx0XHR9XG5cdF07XG5cblx0JHNjb3BlLnNlbGVjdEdlbnJlID0gZnVuY3Rpb24oZ2VucmUpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuZ2VucmUgPSBnZW5yZTtcblx0XHRjb25zb2xlLmxvZygkc2NvcGUubmV3U3RvcnkuZ2VucmUpO1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLmdvQmFjayA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cblx0JHNjb3BlLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0fVxuXG5cdCRzY29wZS5zdWJtaXRUaXRsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cdCRzY29wZS5zdWJtaXRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnB1c2goe2ltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLCBjb250ZW50OiAnJ30pO1xuXHRcdCRzY29wZS5wb3MgPSAkc2NvcGUucGFnZXMubGVuZ3RoICsgMTtcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblx0JHNjb3BlLnNlbGVjdENvdmVyID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmNvdmVyX3VybCA9IHVybDtcblx0fVxuXHQkc2NvcGUuc2VsZWN0UGFnZUltYWdlID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLnBhZ2VzWyRzY29wZS5wb3MtMl0uaW1hZ2VfdXJsID0gdXJsO1xuXHR9XG5cdCRzY29wZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnN0YXR1cyA9IFwicHVibGlzaGVkXCI7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KVxuXHR9XG5cdC8vICRzY29wZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG5cdC8vIFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgpXG5cdC8vIFx0LnRoZW4oZnVuY3Rpb24ocHVibGlzaGVkU3RvcnkpIHtcblx0Ly8gXHRcdGlmIChwdWJsaXNoZWRTdG9yeSkge1xuXHQvLyBcdFx0XHQkc3RhdGUuZ28oJ3N0b3J5Jywge3N0b3J5SWQ6IHB1Ymxpc2hlZFN0b3J5LmlkIH0pXG5cdC8vIFx0XHR9XG5cdFx0XHRcblx0Ly8gXHR9KTtcblx0Ly8gfVxuXG5cdCRzY29wZS5kZWxldGVQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnNwbGljZSgkc2NvcGUucG9zLTIsIDEpO1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JlZXRpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ncmVldGluZy9ncmVldGluZy5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdIb21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgdXNlcnMsICRpbnRlcnZhbCwgdXNlcikge1xuXHRjb25zb2xlLmxvZyh1c2Vycyk7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyXG4gICAgLy9jb25zb2xlLmxvZyh1c2VyKTtcbiAgICBjb25zb2xlLmxvZyhcImhlcmUgaXQgaXNcIiwgJHNjb3BlLnVzZXIpXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciB1c2VyRmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS91c2Vycy9cIjtcblxuXG5cblx0dXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gdXNlci5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcblx0XHRcdHJldHVybiB1c2Vycy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gdXNlckZhY3Rvcnk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdicm93c2VTdG9yaWVzJywge1xuICAgICAgICB1cmw6ICcvYnJvd3NlJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9icm93c2Utc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Jyb3dzZVN0b3JpZXNDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGF1dGhvcnM6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQnJvd3NlU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcnMpIHtcblx0JHNjb3BlLmF1dGhvcnMgPSBhdXRob3JzLmZpbHRlcihmdW5jdGlvbihhdXRob3IpIHtcbiAgICAgICAgcmV0dXJuIGF1dGhvci5zdG9yaWVzLmxlbmd0aDtcbiAgICB9KVxuICAgIFxuICAgICRzY29wZS5zdG9yaWVzID0gW107XG4gICAgJHNjb3BlLmF1dGhvcnMuZm9yRWFjaChmdW5jdGlvbih3cml0ZXIpIHtcbiAgICAgICAgd3JpdGVyLnN0b3JpZXMuZm9yRWFjaChmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9yID0gd3JpdGVyLm5hbWU7XG4gICAgICAgICAgICBzdG9yeS5hdXRob3JJZCA9IHdyaXRlci5pZDtcbiAgICAgICAgICAgICRzY29wZS5zdG9yaWVzLnB1c2goc3RvcnkpO1xuICAgICAgICB9KVxuICAgIH0pXG4gICAgXG4gICAgdmFyIGdlbnJlcyA9IFsnU2NpZW5jZSBGaWN0aW9uJywgJ1JlYWxpc3RpYyBGaWN0aW9uJywgJ05vbmZpY3Rpb24nLCAnRmFudGFzeScsICdSb21hbmNlJywgJ1RyYXZlbCcsICdDaGlsZHJlbicsICdIb3Jyb3InXTtcbiAgICAkc2NvcGUuZ2VucmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW5yZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgJHNjb3BlLmdlbnJlcy5wdXNoKCRzY29wZS5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0b3J5LmdlbnJlID09PSBnZW5yZXNbaV07XG4gICAgICAgIH0pKVxuICAgIH1cbiAgICBcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZVN0b3J5Jywge1xuICAgICAgICB1cmw6ICcvc3RvcnkvOnN0b3J5SWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3N0b3J5L3NpbmdsZS1zdG9yeS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpbmdsZVN0b3J5Q3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRzdG9yeTogZnVuY3Rpb24oU3RvcnlGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgXHRcdHJldHVybiBTdG9yeUZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5zdG9yeUlkKTtcbiAgICAgICAgXHR9LFxuICAgICAgICAgICAgYXV0aG9yOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKHN0b3J5LnVzZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2luZ2xlU3RvcnlDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBTdG9yeUZhY3RvcnksIHN0b3J5LCBhdXRob3IpIHtcblx0JHNjb3BlLmF1dGhvciA9IGF1dGhvcjtcbiAgICAkc2NvcGUubmV3U3RvcnkgPSBzdG9yeTtcbiAgICAkc2NvcGUucGFnZXMgPSBzdG9yeS5wYWdlcztcbiAgICBjb25zb2xlLmxvZygnaGVyZSBpcyB0aGUgc2luZ2xlIHN0b3J5OiAnLCBzdG9yeSk7XG4gICAgdmFyIHZvaWNlID0gd2luZG93LnNwZWVjaFN5bnRoZXNpcztcbiAgICBcbiAgICAkc2NvcGUucmVhZEFsb3VkID0gZnVuY3Rpb24odGV4dCkge1xuXG4gICAgICAgIHZvaWNlLmNhbmNlbCgpO1xuICAgICAgICB2YXIgbXNnID0gbmV3IFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSh0ZXh0KTtcbiAgICAgICAgdm9pY2Uuc3BlYWsobXNnKTtcbiAgICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnU3RvcnlGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciBzdG9yeUZhY3RvcnkgPSB7fTtcblx0dmFyIGJhc2VVcmwgPSBcIi9hcGkvc3Rvcmllcy9cIjtcblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hQdWJsaXNoZWQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdhbGwnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChhbGxTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gYWxsU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24oc3RvcnlJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdzdG9yeS8nICsgc3RvcnlJZClcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdGNvbnNvbGUubG9nKHN0b3J5LmRhdGEpO1xuXHRcdFx0cmV0dXJuIHN0b3J5LmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KGJhc2VVcmwsIHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yeSkge1xuXHRcdFx0Ly8gY29uc29sZS5sb2coJ2hlcmUgaXQgaXM6ICcsIHB1Ymxpc2hlZFN0b3J5KVxuXHRcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yeS5kYXRhXG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdGNvbnNvbGUubG9nKHN0b3J5KTtcblx0XHRcdCRzdGF0ZS5nbygnc2luZ2xlU3RvcnknLCB7c3RvcnlJZDogc3RvcnkuaWR9KVxuXHRcdH0pXG5cdFx0XG5cdH1cblxuXHRzdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5wdXQoYmFzZVVybCArIHN0b3J5LmlkLCBzdG9yeSlcblx0XHQudGhlbihmdW5jdGlvbiAodXBkYXRlZFN0b3J5KSB7XG5cdFx0XHRyZXR1cm4gdXBkYXRlZFN0b3J5LmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5yZWFkID0gZnVuY3Rpb24odGV4dCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJ2h0dHA6Ly9hcGkudm9pY2Vyc3Mub3JnLz9rZXk9MmU3MTQ1MThlNmJhNDZkZDljNDg3MjkwMGU4ODI1NWMmaGw9ZW4tdXMmc3JjPScgKyB0ZXh0KVxuXHRcdC50aGVuIChmdW5jdGlvbiAoc29uZykge1xuXHRcdFx0cmV0dXJuIHNvbmcuZGF0YTtcblx0XHR9KVxuXHRcdC50aGVuKCBmdW5jdGlvbihzb25nVG9QbGF5KSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzb25nVG9QbGF5KVxuXHRcdFx0XG5cdFx0fSlcblx0fVxuXG5cblxuXHRyZXR1cm4gc3RvcnlGYWN0b3J5O1xuXG59KSIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYnJvd3NlU3RvcmllcycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
