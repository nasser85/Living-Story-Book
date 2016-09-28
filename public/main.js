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
    for (var i = 0; i < 94; i++) {

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
app.directive('greeting', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/greeting/greeting.html'
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
    $scope.author = author.name;
    $scope.newStory = story;
    $scope.pages = story.pages;
    console.log('here is the single story: ', story);
    var voice = null;
    $scope.readAloud = function (text) {
        voice = null;

        var msg = new SpeechSynthesisUtterance(text);
        var voices = window.speechSynthesis.getVoices();
        console.log(voices);
        msg.voice = voices.filter(function (el) {
            return el.name === 'Cellos';
        })[0];
        console.log(msg);
        window.speechSynthesis.speak(msg);
        // voice = VoiceRSS.speech({
        //     key: '2e714518e6ba46dd9c4872900e88255c',
        //     src: text,
        //     hl: 'en-gb',
        //     r: 0, 
        //     c: 'mp3',
        //     f: '44khz_16bit_stereo',
        //     ssml: false
        // });
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
app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
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
                    $state.go('home');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsImdyZWV0aW5nL2dyZWV0aW5nLmRpcmVjdGl2ZS5qcyIsInN0b3J5L2Jyb3dzZS5zdG9yaWVzLmpzIiwic3Rvcnkvc2luZ2xlLnN0b3J5LmpzIiwic3Rvcnkvc3RvcnkuZmFjdG9yeS5qcyIsInVzZXIvdXNlci5mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJ0ZW1wbGF0ZVVybCIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwiY29udHJvbGxlciIsInJlc29sdmUiLCJhdXRob3IiLCJVc2VyRmFjdG9yeSIsIiRzdGF0ZVBhcmFtcyIsImZldGNoQnlJZCIsImF1dGhvcklkIiwiJHNjb3BlIiwiU3RvcnlGYWN0b3J5IiwibWVzc2FnZXMiLCJuZXdTdG9yeSIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJwYWdlcyIsInBvcyIsImlkIiwiaW1hZ2VzIiwiaSIsInB1c2giLCJ0b1N0cmluZyIsImltYWdlX3VybCIsImNvbnRlbnQiLCJnZW5yZXMiLCJ0eXBlIiwiaW1hZ2UiLCJzZWxlY3RHZW5yZSIsImNvbnNvbGUiLCJsb2ciLCJzY3JvbGwiLCJnb0JhY2siLCJuZXh0UGFnZSIsInN1Ym1pdFRpdGxlIiwic3VibWl0UGFnZSIsImxlbmd0aCIsInNlbGVjdENvdmVyIiwic2VsZWN0UGFnZUltYWdlIiwicHVibGlzaCIsInB1Ymxpc2hTdG9yeSIsImRlbGV0ZVBhZ2UiLCJzcGxpY2UiLCJFcnJvciIsImZhY3RvcnkiLCJpbyIsIm9yaWdpbiIsImNvbnN0YW50IiwibG9naW5TdWNjZXNzIiwibG9naW5GYWlsZWQiLCJsb2dvdXRTdWNjZXNzIiwic2Vzc2lvblRpbWVvdXQiLCJub3RBdXRoZW50aWNhdGVkIiwibm90QXV0aG9yaXplZCIsIiRxIiwiQVVUSF9FVkVOVFMiLCJzdGF0dXNEaWN0IiwicmVzcG9uc2VFcnJvciIsInJlc3BvbnNlIiwiJGJyb2FkY2FzdCIsInJlamVjdCIsIiRodHRwUHJvdmlkZXIiLCJpbnRlcmNlcHRvcnMiLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwiY2F0Y2giLCJsb2dpbiIsImNyZWRlbnRpYWxzIiwicG9zdCIsIm1lc3NhZ2UiLCJsb2dvdXQiLCJkZXN0cm95Iiwic2VsZiIsInNlc3Npb25JZCIsInVzZXJzIiwiZmV0Y2hBbGwiLCIkaW50ZXJ2YWwiLCJlcnJvciIsInNlbmRMb2dpbiIsImxvZ2luSW5mbyIsImF1dGhvcnMiLCJmaWx0ZXIiLCJzdG9yaWVzIiwiZm9yRWFjaCIsIndyaXRlciIsInN0b3J5Iiwic3RvcnlJZCIsInZvaWNlIiwicmVhZEFsb3VkIiwidGV4dCIsIm1zZyIsIlNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSIsInZvaWNlcyIsInNwZWVjaFN5bnRoZXNpcyIsImdldFZvaWNlcyIsImVsIiwic3BlYWsiLCJzdG9yeUZhY3RvcnkiLCJiYXNlVXJsIiwiZmV0Y2hQdWJsaXNoZWQiLCJwdWJsaXNoZWRTdG9yaWVzIiwiYWxsU3RvcmllcyIsInB1Ymxpc2hlZFN0b3J5IiwidXBkYXRlU3RvcnkiLCJwdXQiLCJ1cGRhdGVkU3RvcnkiLCJyZWFkIiwic29uZyIsInNvbmdUb1BsYXkiLCJ1c2VyRmFjdG9yeSIsImdldFJhbmRvbUZyb21BcnJheSIsImFyciIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImdyZWV0aW5ncyIsImdldFJhbmRvbUdyZWV0aW5nIiwiUmFuZG9tR3JlZXRpbmdzIiwibGluayIsInNjb3BlIiwiZ3JlZXRpbmciLCJpc0xvZ2dlZEluIiwic2V0VXNlciIsInJlbW92ZVVzZXIiXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBQSxPQUFBQyxHQUFBLEdBQUFDLFFBQUFDLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBOztBQUVBRixJQUFBRyxNQUFBLENBQUEsVUFBQUMsa0JBQUEsRUFBQUMsaUJBQUEsRUFBQTtBQUNBO0FBQ0FBLHNCQUFBQyxTQUFBLENBQUEsSUFBQTtBQUNBO0FBQ0FGLHVCQUFBRyxTQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0FILHVCQUFBSSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0FULGVBQUFVLFFBQUEsQ0FBQUMsTUFBQTtBQUNBLEtBRkE7QUFHQSxDQVRBOztB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QkFBQXVJLFVBQUEsU0FBQUEsT0FBQSxHQUFBO0FBQ0F0Siw0QkFBQVksZUFBQSxHQUFBQyxJQUFBLENBQUEsVUFBQUMsSUFBQSxFQUFBO0FBQ0FxSSwwQkFBQXJJLElBQUEsR0FBQUEsSUFBQTtBQUNBLGlCQUZBO0FBR0EsYUFKQTs7QUFNQSxnQkFBQXlJLGFBQUEsU0FBQUEsVUFBQSxHQUFBO0FBQ0FKLHNCQUFBckksSUFBQSxHQUFBLElBQUE7QUFDQSxhQUZBOztBQUlBd0k7O0FBRUF2Six1QkFBQU8sR0FBQSxDQUFBdUUsWUFBQVAsWUFBQSxFQUFBZ0YsT0FBQTtBQUNBdkosdUJBQUFPLEdBQUEsQ0FBQXVFLFlBQUFMLGFBQUEsRUFBQStFLFVBQUE7QUFDQXhKLHVCQUFBTyxHQUFBLENBQUF1RSxZQUFBSixjQUFBLEVBQUE4RSxVQUFBO0FBRUE7O0FBbENBLEtBQUE7QUFzQ0EsQ0F4Q0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdzbGljayddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWNjb3VudCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FjY291bnQvYWNjb3VudC5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRob3InLCB7XG4gICAgICAgIHVybDogJy9hdXRob3IvOmF1dGhvcklkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hdXRob3IvYXV0aG9yLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXV0aG9yQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmF1dGhvcklkKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQXV0aG9yQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgYXV0aG9yKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY3JlYXRlL2NyZWF0ZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ3JlYXRlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCAkc3RhdGUsIHVzZXIpIHtcblx0JHNjb3BlLm1lc3NhZ2VzID0gW1wic2VsZWN0IGEgZ2VucmUgZm9yIHlvdXIgbmV3IHN0b3J5XCIsIFwiZGVzaWduIHRoZSBjb3ZlciBvZiB5b3VyIHN0b3J5IGJvb2tcIiwgXCJkZXNpZ24geW91ciBib29rJ3MgcGFnZXNcIl1cblx0JHNjb3BlLm5ld1N0b3J5ID0ge1xuXHRcdHRpdGxlOiBcIk15IE5ldyBTdG9yeVwiLFxuXHRcdHN0YXR1czogXCJpbmNvbXBsZXRlXCIsXG5cdFx0Y292ZXJfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0Z2VucmU6IFwibm9uZVwiLFxuXHRcdHVzZXJJZDogMSxcblx0XHRwYWdlczogbnVsbFxuXHR9XG5cdCRzY29wZS5wb3MgPSAwO1xuXHQkc2NvcGUuYXV0aG9yID0gXCJhbm9ueW1vdXNcIlxuXHRpZiAodXNlcikge1xuXHRcdCRzY29wZS5hdXRob3IgPSB1c2VyLm5hbWU7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnVzZXJJZCA9IHVzZXIuaWQ7IFxuXHR9XG5cdFxuXHQkc2NvcGUuaW1hZ2VzID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgOTQ7IGkrKykge1xuXG5cdFx0JHNjb3BlLmltYWdlcy5wdXNoKGkudG9TdHJpbmcoKSArICcucG5nJyk7XG5cdH1cblx0XG5cblx0JHNjb3BlLnBhZ2VzID0gW1xuXHRcdHtcblx0XHRcdGltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0Y29udGVudDogXCJcIlxuXHRcdH1cblx0XTtcblxuXHQkc2NvcGUuZ2VucmVzID0gW1xuXHRcdHtcblx0XHRcdHR5cGU6ICdTY2llbmNlIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdzY2llbmNlLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSZWFsaXN0aWMgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3JlYWxpc3RpYy1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnTm9uZmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ25vbmZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdGYW50YXN5Jyxcblx0XHRcdGltYWdlOiAnZmFudGFzeS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JvbWFuY2UnLFxuXHRcdFx0aW1hZ2U6ICdyb21hbmNlLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnVHJhdmVsJyxcblx0XHRcdGltYWdlOiAndHJhdmVsLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnQ2hpbGRyZW4nLFxuXHRcdFx0aW1hZ2U6ICdjaGlsZHJlbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0hvcnJvcicsXG5cdFx0XHRpbWFnZTogJ2FkdWx0LmpwZycsXG5cdFx0fVxuXHRdO1xuXG5cdCRzY29wZS5zZWxlY3RHZW5yZSA9IGZ1bmN0aW9uKGdlbnJlKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmdlbnJlID0gZ2VucmU7XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLm5ld1N0b3J5LmdlbnJlKTtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5nb0JhY2sgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zIC0tO1xuXHR9XG5cdCRzY29wZS5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0VGl0bGUgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXHQkc2NvcGUuc3VibWl0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wYWdlcy5wdXNoKHtpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIiwgY29udGVudDogJyd9KTtcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cdCRzY29wZS5zZWxlY3RDb3ZlciA9IGZ1bmN0aW9uKHVybCkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5jb3Zlcl91cmwgPSB1cmw7XG5cdH1cblx0JHNjb3BlLnNlbGVjdFBhZ2VJbWFnZSA9IGZ1bmN0aW9uKHVybCkge1xuXHRcdCRzY29wZS5wYWdlc1skc2NvcGUucG9zLTJdLmltYWdlX3VybCA9IHVybDtcblx0fVxuXHQkc2NvcGUucHVibGlzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5zdGF0dXMgPSBcInB1Ymxpc2hlZFwiO1xuXHRcdCRzY29wZS5uZXdTdG9yeS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblx0XHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KCRzY29wZS5uZXdTdG9yeSlcblx0fVxuXHQvLyAkc2NvcGUucHVibGlzaCA9IGZ1bmN0aW9uKCkge1xuXHQvLyBcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoKVxuXHQvLyBcdC50aGVuKGZ1bmN0aW9uKHB1Ymxpc2hlZFN0b3J5KSB7XG5cdC8vIFx0XHRpZiAocHVibGlzaGVkU3RvcnkpIHtcblx0Ly8gXHRcdFx0JHN0YXRlLmdvKCdzdG9yeScsIHtzdG9yeUlkOiBwdWJsaXNoZWRTdG9yeS5pZCB9KVxuXHQvLyBcdFx0fVxuXHRcdFx0XG5cdC8vIFx0fSk7XG5cdC8vIH1cblxuXHQkc2NvcGUuZGVsZXRlUGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wYWdlcy5zcGxpY2UoJHNjb3BlLnBvcy0yLCAxKTtcblx0XHQkc2NvcGUucG9zIC0tO1xuXHR9XG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXJzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VycywgJGludGVydmFsLCB1c2VyKSB7XG5cdGNvbnNvbGUubG9nKHVzZXJzKTtcbiAgICAkc2NvcGUudXNlciA9IHVzZXJcbiAgICAvL2NvbnNvbGUubG9nKHVzZXIpO1xuICAgIGNvbnNvbGUubG9nKFwiaGVyZSBpdCBpc1wiLCAkc2NvcGUudXNlcilcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCdncmVldGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2dyZWV0aW5nL2dyZWV0aW5nLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jyb3dzZVN0b3JpZXMnLCB7XG4gICAgICAgIHVybDogJy9icm93c2UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3N0b3J5L2Jyb3dzZS1zdG9yaWVzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQnJvd3NlU3Rvcmllc0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YXV0aG9yczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdCcm93c2VTdG9yaWVzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgYXV0aG9ycykge1xuXHQkc2NvcGUuYXV0aG9ycyA9IGF1dGhvcnMuZmlsdGVyKGZ1bmN0aW9uKGF1dGhvcikge1xuICAgICAgICByZXR1cm4gYXV0aG9yLnN0b3JpZXMubGVuZ3RoO1xuICAgIH0pXG4gICAgXG4gICAgJHNjb3BlLnN0b3JpZXMgPSBbXTtcbiAgICAkc2NvcGUuYXV0aG9ycy5mb3JFYWNoKGZ1bmN0aW9uKHdyaXRlcikge1xuICAgICAgICB3cml0ZXIuc3Rvcmllcy5mb3JFYWNoKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICBzdG9yeS5hdXRob3IgPSB3cml0ZXIubmFtZTtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvcklkID0gd3JpdGVyLmlkO1xuICAgICAgICAgICAgJHNjb3BlLnN0b3JpZXMucHVzaChzdG9yeSk7XG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBcbiAgICB2YXIgZ2VucmVzID0gWydTY2llbmNlIEZpY3Rpb24nLCAnUmVhbGlzdGljIEZpY3Rpb24nLCAnTm9uZmljdGlvbicsICdGYW50YXN5JywgJ1JvbWFuY2UnLCAnVHJhdmVsJywgJ0NoaWxkcmVuJywgJ0hvcnJvciddO1xuICAgICRzY29wZS5nZW5yZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbnJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAkc2NvcGUuZ2VucmVzLnB1c2goJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IGdlbnJlc1tpXTtcbiAgICAgICAgfSkpXG4gICAgfVxuICAgIFxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU3RvcnknLCB7XG4gICAgICAgIHVybDogJy9zdG9yeS86c3RvcnlJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3Rvcnkvc2luZ2xlLXN0b3J5Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2luZ2xlU3RvcnlDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHN0b3J5OiBmdW5jdGlvbihTdG9yeUZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuICAgICAgICBcdFx0cmV0dXJuIFN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnN0b3J5SWQpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICBhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoc3RvcnkudXNlcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaW5nbGVTdG9yeUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgc3RvcnksIGF1dGhvcikge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yLm5hbWU7XG4gICAgJHNjb3BlLm5ld1N0b3J5ID0gc3Rvcnk7XG4gICAgJHNjb3BlLnBhZ2VzID0gc3RvcnkucGFnZXM7XG4gICAgY29uc29sZS5sb2coJ2hlcmUgaXMgdGhlIHNpbmdsZSBzdG9yeTogJywgc3RvcnkpO1xuICAgIHZhciB2b2ljZSA9IG51bGw7XG4gICAgJHNjb3BlLnJlYWRBbG91ZCA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgdm9pY2UgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UodGV4dCk7XG4gICAgICAgIHZhciB2b2ljZXMgPSB3aW5kb3cuc3BlZWNoU3ludGhlc2lzLmdldFZvaWNlcygpO1xuICAgICAgICBjb25zb2xlLmxvZyh2b2ljZXMpO1xuICAgICAgICBtc2cudm9pY2UgPSB2b2ljZXMuZmlsdGVyKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwubmFtZSA9PT0gJ0NlbGxvcyc7XG4gICAgICAgIH0pWzBdO1xuICAgICAgICBjb25zb2xlLmxvZyhtc2cpO1xuICAgICAgICB3aW5kb3cuc3BlZWNoU3ludGhlc2lzLnNwZWFrKG1zZyk7XG4gICAgICAgIC8vIHZvaWNlID0gVm9pY2VSU1Muc3BlZWNoKHtcbiAgICAgICAgLy8gICAgIGtleTogJzJlNzE0NTE4ZTZiYTQ2ZGQ5YzQ4NzI5MDBlODgyNTVjJyxcbiAgICAgICAgLy8gICAgIHNyYzogdGV4dCxcbiAgICAgICAgLy8gICAgIGhsOiAnZW4tZ2InLFxuICAgICAgICAvLyAgICAgcjogMCwgXG4gICAgICAgIC8vICAgICBjOiAnbXAzJyxcbiAgICAgICAgLy8gICAgIGY6ICc0NGtoel8xNmJpdF9zdGVyZW8nLFxuICAgICAgICAvLyAgICAgc3NtbDogZmFsc2VcbiAgICAgICAgLy8gfSk7XG4gICAgfVxufSk7IiwiYXBwLmZhY3RvcnkoJ1N0b3J5RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUpe1xuXHR2YXIgc3RvcnlGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3N0b3JpZXMvXCI7XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoUHVibGlzaGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnYWxsJylcblx0XHQudGhlbihmdW5jdGlvbiAoYWxsU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIGFsbFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uKHN0b3J5SWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnc3RvcnkvJyArIHN0b3J5SWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzdG9yeS5kYXRhKTtcblx0XHRcdHJldHVybiBzdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdChiYXNlVXJsLCBzdG9yeSlcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3RvcnkpIHtcblx0XHRcdC8vIGNvbnNvbGUubG9nKCdoZXJlIGl0IGlzOiAnLCBwdWJsaXNoZWRTdG9yeSlcblx0XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3RvcnkuZGF0YVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzdG9yeSk7XG5cdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZVN0b3J5Jywge3N0b3J5SWQ6IHN0b3J5LmlkfSlcblx0XHR9KVxuXHRcdFxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucHV0KGJhc2VVcmwgKyBzdG9yeS5pZCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVwZGF0ZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHVwZGF0ZWRTdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucmVhZCA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCdodHRwOi8vYXBpLnZvaWNlcnNzLm9yZy8/a2V5PTJlNzE0NTE4ZTZiYTQ2ZGQ5YzQ4NzI5MDBlODgyNTVjJmhsPWVuLXVzJnNyYz0nICsgdGV4dClcblx0XHQudGhlbiAoZnVuY3Rpb24gKHNvbmcpIHtcblx0XHRcdHJldHVybiBzb25nLmRhdGE7XG5cdFx0fSlcblx0XHQudGhlbiggZnVuY3Rpb24oc29uZ1RvUGxheSkge1xuXHRcdFx0Y29uc29sZS5sb2coc29uZ1RvUGxheSlcblx0XHRcdFxuXHRcdH0pXG5cdH1cblxuXG5cblx0cmV0dXJuIHN0b3J5RmFjdG9yeTtcblxufSkiLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHVzZXJGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3VzZXJzL1wiO1xuXG5cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdHJldHVybiB1c2VyLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuXHRcdFx0cmV0dXJuIHVzZXJzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiB1c2VyRmFjdG9yeTtcbn0pOyIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
