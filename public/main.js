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

app.controller('CreateCtrl', function ($scope, StoryFactory, $state, user, $rootScope) {
    $scope.user = user;
    $scope.submission = {};
    $scope.message = null;
    $scope.messages = ["select a genre for your new story", "design the cover of your story", "design your book's pages", "Please wait while your book is published.", "Please wait while your book is saved.", 'Enter the URL of the picture that you would like to use.'];
    if ($rootScope.story) {
        $scope.newStory = $rootScope.story;
        $scope.pages = $scope.newStory.pages;
        $scope.pos = $scope.pages.length + 1;
    } else {
        $scope.newStory = {
            title: "My New Story",
            status: "incomplete",
            cover_url: "not-available.jpg",
            genre: "none",
            userId: 1,
            pages: null
        };
        $scope.pages = [{
            image_url: "not-available.jpg",
            content: ""
        }];
        $scope.pos = 0;
    }

    $scope.author = "anonymous";
    if (user) {
        $scope.author = user.name;
        $scope.newStory.userId = user.id;
    }

    $scope.images = [];
    for (var i = 0; i < 267; i++) {

        $scope.images.push(i.toString() + '.png');
    }

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
        if (!$scope.message) {
            $scope.message = $scope.messages[3];
            $scope.newStory.status = "published";
            $scope.newStory.pages = $scope.pages;
            if ($scope.newStory.id) {
                StoryFactory.updateStory($scope.newStory);
            } else {
                StoryFactory.publishStory($scope.newStory);
            }
            $rootScope.pageUpdate = true;
        }
    };

    $scope.saveStory = function () {
        if (!$scope.message) {
            $scope.message = $scope.messages[4];
            $scope.newStory.pages = $scope.pages;
            if ($scope.newStory.id) {
                StoryFactory.updateStory($scope.newStory);
            } else {
                StoryFactory.publishStory($scope.newStory);
            }
            $rootScope.pageUpdate = true;
        }
    };

    $scope.submitUrl = function () {
        document.getElementById("input_text").focus();
        $scope.message = $scope.messages[5];
        $scope.submission.image = "";
    };
    $scope.cancelSubmission = function () {
        $scope.message = null;
    };

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

app.controller('HomeCtrl', function ($scope, users, user, $rootScope, $state) {
    $scope.user = user;
    $scope.createNew = function () {
        $rootScope.story = null;
    };
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
app.directive('messagePrompt', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/message/message.html'
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
            if (story.status === 'published') {
                $scope.stories.push(story);
            }
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
            },
            user: function user(AuthService) {
                return AuthService.getLoggedInUser();
            }
        }
    });
});

app.controller('SingleStoryCtrl', function ($scope, StoryFactory, story, author, user, $rootScope) {
    $scope.author = author;
    $scope.newStory = story;
    $scope.pages = story.pages;
    $scope.message = null;
    $scope.deletability = function () {
        if (user.id === author.id || user.google_id === "105690537679974787001") {
            return true;
        }
        return false;
    };
    var voice = window.speechSynthesis;

    $scope.deleteStory = function (story) {
        if ($scope.message !== "Deleting book...") {
            if (!$scope.message) {
                $scope.message = "Are you sure you want to delete this book?";
            } else {
                $scope.message = "Deleting book...";
                $rootScope.pageUpdate = true;
                StoryFactory.delete(story);
            }
        }
    };
    $scope.cancelDelete = function () {
        $scope.message = null;
    };
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
            return story.data;
        });
    };

    storyFactory.fetchUserStories = function (userId) {
        return $http.get(baseUrl + 'user/' + userId).then(function (stories) {
            return stories.data;
        });
    };

    storyFactory.publishStory = function (story) {
        return $http.post(baseUrl, story).then(function (publishedStory) {
            return publishedStory.data;
        }).then(function (story) {
            $state.go('singleStory', { storyId: story.id });
        });
    };

    storyFactory.delete = function (story) {
        return $http.delete(baseUrl + story.id).then(function (deletedStory) {
            return deletedStory.data;
        }).then(function (deleted) {
            $state.go('home');
        });
    };

    storyFactory.updateStory = function (story) {
        var currStory = this;
        currStory.delete(story).then(function () {
            return currStory.publishStory(story);
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
app.config(function ($stateProvider) {
    $stateProvider.state('yourStories', {
        url: '/yourstories',
        templateUrl: 'js/your/your-stories.html',
        controller: 'YourStoriesCtrl',
        resolve: {
            user: function user(AuthService) {
                return AuthService.getLoggedInUser();
            }
        }
    });
});

app.controller('YourStoriesCtrl', function ($scope, user, $rootScope, $state, AuthService) {

    if ($rootScope.pageUpdate) {
        window.location.reload();
        $rootScope.pageUpdate = false;
    }

    $scope.user = user;
    $scope.publishedStories = $scope.user.stories.filter(function (story) {
        return story.status === 'published';
    });
    $scope.unfinishedStories = $scope.user.stories.filter(function (story) {
        return story.status !== 'published';
    });

    $scope.resume = function (story) {
        $rootScope.story = story;
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lc3NhZ2UvbWVzc2FnZS5kaXJlY3RpdmUuanMiLCJzdG9yeS9icm93c2Uuc3Rvcmllcy5qcyIsInN0b3J5L3NpbmdsZS5zdG9yeS5qcyIsInN0b3J5L3N0b3J5LmZhY3RvcnkuanMiLCJ1c2VyL3VzZXIuZmFjdG9yeS5qcyIsInlvdXIveW91ci5zdG9yaWVzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJ0ZW1wbGF0ZVVybCIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwiY29udHJvbGxlciIsInJlc29sdmUiLCJhdXRob3IiLCJVc2VyRmFjdG9yeSIsIiRzdGF0ZVBhcmFtcyIsImZldGNoQnlJZCIsImF1dGhvcklkIiwiJHNjb3BlIiwiU3RvcnlGYWN0b3J5Iiwic3VibWlzc2lvbiIsIm1lc3NhZ2UiLCJtZXNzYWdlcyIsInN0b3J5IiwibmV3U3RvcnkiLCJwYWdlcyIsInBvcyIsImxlbmd0aCIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJpbWFnZV91cmwiLCJjb250ZW50IiwiaWQiLCJpbWFnZXMiLCJpIiwicHVzaCIsInRvU3RyaW5nIiwiZ2VucmVzIiwidHlwZSIsImltYWdlIiwic2VsZWN0R2VucmUiLCJjb25zb2xlIiwibG9nIiwic2Nyb2xsIiwiZ29CYWNrIiwibmV4dFBhZ2UiLCJzdWJtaXRUaXRsZSIsInN1Ym1pdFBhZ2UiLCJzZWxlY3RDb3ZlciIsInNlbGVjdFBhZ2VJbWFnZSIsInB1Ymxpc2giLCJ1cGRhdGVTdG9yeSIsInB1Ymxpc2hTdG9yeSIsInBhZ2VVcGRhdGUiLCJzYXZlU3RvcnkiLCJzdWJtaXRVcmwiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiZm9jdXMiLCJjYW5jZWxTdWJtaXNzaW9uIiwiZGVsZXRlUGFnZSIsInNwbGljZSIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0IiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsIiRpbmplY3RvciIsImdldCIsInNlcnZpY2UiLCIkaHR0cCIsIlNlc3Npb24iLCJvblN1Y2Nlc3NmdWxMb2dpbiIsImNyZWF0ZSIsImZyb21TZXJ2ZXIiLCJjYXRjaCIsImxvZ2luIiwiY3JlZGVudGlhbHMiLCJwb3N0IiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJ1c2VycyIsImZldGNoQWxsIiwiY3JlYXRlTmV3IiwiZXJyb3IiLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJhdXRob3JzIiwiZmlsdGVyIiwic3RvcmllcyIsImZvckVhY2giLCJ3cml0ZXIiLCJzdG9yeUlkIiwiZGVsZXRhYmlsaXR5IiwiZ29vZ2xlX2lkIiwidm9pY2UiLCJzcGVlY2hTeW50aGVzaXMiLCJkZWxldGVTdG9yeSIsImRlbGV0ZSIsImNhbmNlbERlbGV0ZSIsInJlYWRBbG91ZCIsInRleHQiLCJjYW5jZWwiLCJtc2ciLCJTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UiLCJzcGVhayIsInN0b3J5RmFjdG9yeSIsImJhc2VVcmwiLCJmZXRjaFB1Ymxpc2hlZCIsInB1Ymxpc2hlZFN0b3JpZXMiLCJhbGxTdG9yaWVzIiwiZmV0Y2hVc2VyU3RvcmllcyIsInB1Ymxpc2hlZFN0b3J5IiwiZGVsZXRlZFN0b3J5IiwiZGVsZXRlZCIsImN1cnJTdG9yeSIsInVzZXJGYWN0b3J5IiwidW5maW5pc2hlZFN0b3JpZXMiLCJyZXN1bWUiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FB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Q0FqSyx1QkFBQU8sR0FBQSxDQUFBa0YsWUFBQUwsYUFBQSxFQUFBOEUsVUFBQTtBQUNBbEssdUJBQUFPLEdBQUEsQ0FBQWtGLFlBQUFKLGNBQUEsRUFBQTZFLFVBQUE7QUFFQTs7QUFsQ0EsS0FBQTtBQXNDQSxDQXhDQTs7QUNBQTlLLElBQUE4QixTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUFpSixlQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBaEosa0JBQUEsR0FEQTtBQUVBQyxxQkFBQSx5REFGQTtBQUdBMkksY0FBQSxjQUFBRCxLQUFBLEVBQUE7QUFDQUEsa0JBQUFNLFFBQUEsR0FBQUQsZ0JBQUFOLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnc2xpY2snXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FjY291bnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hY2NvdW50L2FjY291bnQuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aG9yJywge1xuICAgICAgICB1cmw6ICcvYXV0aG9yLzphdXRob3JJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYXV0aG9yL2F1dGhvci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0F1dGhvckN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YXV0aG9yOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5hdXRob3JJZCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0F1dGhvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcikge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjcmVhdGUnLCB7XG4gICAgICAgIHVybDogJy9jcmVhdGUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NyZWF0ZS9jcmVhdGUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDcmVhdGVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NyZWF0ZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgJHN0YXRlLCB1c2VyLCAkcm9vdFNjb3BlKSB7XG5cdCRzY29wZS51c2VyID0gdXNlcjtcblx0JHNjb3BlLnN1Ym1pc3Npb24gPSB7fTtcblx0JHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuXHQkc2NvcGUubWVzc2FnZXMgPSBbXCJzZWxlY3QgYSBnZW5yZSBmb3IgeW91ciBuZXcgc3RvcnlcIiwgXCJkZXNpZ24gdGhlIGNvdmVyIG9mIHlvdXIgc3RvcnlcIiwgXCJkZXNpZ24geW91ciBib29rJ3MgcGFnZXNcIiwgXCJQbGVhc2Ugd2FpdCB3aGlsZSB5b3VyIGJvb2sgaXMgcHVibGlzaGVkLlwiLCBcIlBsZWFzZSB3YWl0IHdoaWxlIHlvdXIgYm9vayBpcyBzYXZlZC5cIiwgJ0VudGVyIHRoZSBVUkwgb2YgdGhlIHBpY3R1cmUgdGhhdCB5b3Ugd291bGQgbGlrZSB0byB1c2UuJ11cblx0aWYgKCRyb290U2NvcGUuc3RvcnkpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkgPSAkcm9vdFNjb3BlLnN0b3J5O1xuXHRcdCRzY29wZS5wYWdlcyA9ICRzY29wZS5uZXdTdG9yeS5wYWdlcztcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdH0gZWxzZSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5ID0ge1xuXHRcdFx0dGl0bGU6IFwiTXkgTmV3IFN0b3J5XCIsXG5cdFx0XHRzdGF0dXM6IFwiaW5jb21wbGV0ZVwiLFxuXHRcdFx0Y292ZXJfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRnZW5yZTogXCJub25lXCIsXG5cdFx0XHR1c2VySWQ6IDEsXG5cdFx0XHRwYWdlczogbnVsbFxuXHRcdH1cblx0XHQkc2NvcGUucGFnZXMgPSBbXG5cdFx0XHR7XG5cdFx0XHRcdGltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0XHRjb250ZW50OiBcIlwiXG5cdFx0XHR9XG5cdFx0XTtcblx0XHQkc2NvcGUucG9zID0gMDtcblx0fVxuXHRcblx0JHNjb3BlLmF1dGhvciA9IFwiYW5vbnltb3VzXCJcblx0aWYgKHVzZXIpIHtcblx0XHQkc2NvcGUuYXV0aG9yID0gdXNlci5uYW1lO1xuXHRcdCRzY29wZS5uZXdTdG9yeS51c2VySWQgPSB1c2VyLmlkOyBcblx0fVxuXHRcblx0JHNjb3BlLmltYWdlcyA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IDI2NzsgaSsrKSB7XG5cblx0XHQkc2NvcGUuaW1hZ2VzLnB1c2goaS50b1N0cmluZygpICsgJy5wbmcnKTtcblx0fVxuXHRcblxuXHRcblxuXHQkc2NvcGUuZ2VucmVzID0gW1xuXHRcdHtcblx0XHRcdHR5cGU6ICdTY2llbmNlIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdzY2llbmNlLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSZWFsaXN0aWMgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3JlYWxpc3RpYy1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnTm9uZmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ25vbmZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdGYW50YXN5Jyxcblx0XHRcdGltYWdlOiAnZmFudGFzeS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JvbWFuY2UnLFxuXHRcdFx0aW1hZ2U6ICdyb21hbmNlLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnVHJhdmVsJyxcblx0XHRcdGltYWdlOiAndHJhdmVsLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnQ2hpbGRyZW4nLFxuXHRcdFx0aW1hZ2U6ICdjaGlsZHJlbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0hvcnJvcicsXG5cdFx0XHRpbWFnZTogJ2FkdWx0LmpwZycsXG5cdFx0fVxuXHRdO1xuXG5cdCRzY29wZS5zZWxlY3RHZW5yZSA9IGZ1bmN0aW9uKGdlbnJlKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmdlbnJlID0gZ2VucmU7XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLm5ld1N0b3J5LmdlbnJlKTtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5nb0JhY2sgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zIC0tO1xuXHR9XG5cdCRzY29wZS5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0VGl0bGUgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5zdWJtaXRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnB1c2goe2ltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLCBjb250ZW50OiAnJ30pO1xuXHRcdCRzY29wZS5wb3MgPSAkc2NvcGUucGFnZXMubGVuZ3RoICsgMTtcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuY292ZXJfdXJsID0gdXJsO1xuXHR9XG5cblx0JHNjb3BlLnNlbGVjdFBhZ2VJbWFnZSA9IGZ1bmN0aW9uKHVybCkge1xuXHRcdCRzY29wZS5wYWdlc1skc2NvcGUucG9zLTJdLmltYWdlX3VybCA9IHVybDtcblx0fVxuXG5cdCRzY29wZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCEkc2NvcGUubWVzc2FnZSkge1xuXHRcdFx0JHNjb3BlLm1lc3NhZ2UgPSAkc2NvcGUubWVzc2FnZXNbM107XG5cdFx0XHQkc2NvcGUubmV3U3Rvcnkuc3RhdHVzID0gXCJwdWJsaXNoZWRcIjtcblx0XHRcdCRzY29wZS5uZXdTdG9yeS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblx0XHRcdGlmICgkc2NvcGUubmV3U3RvcnkuaWQpIHtcblx0XHRcdFx0U3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5KCRzY29wZS5uZXdTdG9yeSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KTtcblx0XHRcdH1cblx0XHRcdCRyb290U2NvcGUucGFnZVVwZGF0ZSA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblx0JHNjb3BlLnNhdmVTdG9yeSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghJHNjb3BlLm1lc3NhZ2UpIHtcblx0XHRcdCRzY29wZS5tZXNzYWdlID0gJHNjb3BlLm1lc3NhZ2VzWzRdO1xuXHRcdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdFx0aWYgKCRzY29wZS5uZXdTdG9yeS5pZCkge1xuXHRcdFx0XHRTdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkoJHNjb3BlLm5ld1N0b3J5KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpO1xuXHRcdFx0fVxuXHRcdFx0JHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0VXJsID0gZnVuY3Rpb24oKSB7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbnB1dF90ZXh0XCIpLmZvY3VzKCk7XG5cdFx0JHNjb3BlLm1lc3NhZ2UgPSAkc2NvcGUubWVzc2FnZXNbNV07XG5cdFx0JHNjb3BlLnN1Ym1pc3Npb24uaW1hZ2UgPSBcIlwiO1xuXHR9XG5cdCRzY29wZS5jYW5jZWxTdWJtaXNzaW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuXHR9XG5cblx0JHNjb3BlLmRlbGV0ZVBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMuc3BsaWNlKCRzY29wZS5wb3MtMiwgMSk7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncmVldGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2dyZWV0aW5nL2dyZWV0aW5nLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXJzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VycywgdXNlciwgJHJvb3RTY29wZSwgJHN0YXRlKSB7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5jcmVhdGVOZXcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RTY29wZS5zdG9yeSA9IG51bGw7XG4gICAgfVxuXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbWVzc2FnZVByb21wdCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL21lc3NhZ2UvbWVzc2FnZS5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdicm93c2VTdG9yaWVzJywge1xuICAgICAgICB1cmw6ICcvYnJvd3NlJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9icm93c2Utc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Jyb3dzZVN0b3JpZXNDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGF1dGhvcnM6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQnJvd3NlU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcnMpIHtcblx0JHNjb3BlLmF1dGhvcnMgPSBhdXRob3JzLmZpbHRlcihmdW5jdGlvbihhdXRob3IpIHtcbiAgICAgICAgcmV0dXJuIGF1dGhvci5zdG9yaWVzLmxlbmd0aDtcbiAgICB9KVxuICAgIFxuICAgICRzY29wZS5zdG9yaWVzID0gW107XG4gICAgJHNjb3BlLmF1dGhvcnMuZm9yRWFjaChmdW5jdGlvbih3cml0ZXIpIHtcbiAgICAgICAgd3JpdGVyLnN0b3JpZXMuZm9yRWFjaChmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9yID0gd3JpdGVyLm5hbWU7XG4gICAgICAgICAgICBzdG9yeS5hdXRob3JJZCA9IHdyaXRlci5pZDtcbiAgICAgICAgICAgIGlmIChzdG9yeS5zdGF0dXMgPT09ICdwdWJsaXNoZWQnKSB7XG4gICAgICAgICAgICAgICAkc2NvcGUuc3Rvcmllcy5wdXNoKHN0b3J5KTsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIFxuICAgIHZhciBnZW5yZXMgPSBbJ1NjaWVuY2UgRmljdGlvbicsICdSZWFsaXN0aWMgRmljdGlvbicsICdOb25maWN0aW9uJywgJ0ZhbnRhc3knLCAnUm9tYW5jZScsICdUcmF2ZWwnLCAnQ2hpbGRyZW4nLCAnSG9ycm9yJ107XG4gICAgJHNjb3BlLmdlbnJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VucmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICRzY29wZS5nZW5yZXMucHVzaCgkc2NvcGUuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yeS5nZW5yZSA9PT0gZ2VucmVzW2ldO1xuICAgICAgICB9KSlcbiAgICB9XG4gICAgXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTdG9yeScsIHtcbiAgICAgICAgdXJsOiAnL3N0b3J5LzpzdG9yeUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9zaW5nbGUtc3RvcnkuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaW5nbGVTdG9yeUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0c3Rvcnk6IGZ1bmN0aW9uKFN0b3J5RmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU3RvcnlGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuc3RvcnlJZCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIGF1dGhvcjogZnVuY3Rpb24oVXNlckZhY3RvcnksIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZChzdG9yeS51c2VySWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpbmdsZVN0b3J5Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCBzdG9yeSwgYXV0aG9yLCB1c2VyLCAkcm9vdFNjb3BlKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG4gICAgJHNjb3BlLm5ld1N0b3J5ID0gc3Rvcnk7XG4gICAgJHNjb3BlLnBhZ2VzID0gc3RvcnkucGFnZXM7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuICAgICRzY29wZS5kZWxldGFiaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHVzZXIuaWQgPT09IGF1dGhvci5pZCB8fCB1c2VyLmdvb2dsZV9pZCA9PT0gXCIxMDU2OTA1Mzc2Nzk5NzQ3ODcwMDFcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgXG4gICAgfVxuICAgIHZhciB2b2ljZSA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgXG4gICAgJHNjb3BlLmRlbGV0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgaWYgKCRzY29wZS5tZXNzYWdlICE9PSBcIkRlbGV0aW5nIGJvb2suLi5cIikge1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgYm9vaz9cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2UgPSBcIkRlbGV0aW5nIGJvb2suLi5cIjtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIFN0b3J5RmFjdG9yeS5kZWxldGUoc3RvcnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IFxuICAgIH1cbiAgICAkc2NvcGUuY2FuY2VsRGVsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5tZXNzYWdlID0gbnVsbDtcbiAgICB9XG4gICAgJHNjb3BlLnJlYWRBbG91ZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICAgICAgICB2b2ljZS5jYW5jZWwoKTtcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UodGV4dCk7XG4gICAgICAgIHZvaWNlLnNwZWFrKG1zZyk7XG4gICAgfVxuXG59KTsiLCJhcHAuZmFjdG9yeSgnU3RvcnlGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciBzdG9yeUZhY3RvcnkgPSB7fTtcblx0dmFyIGJhc2VVcmwgPSBcIi9hcGkvc3Rvcmllcy9cIjtcblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hQdWJsaXNoZWQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdhbGwnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChhbGxTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gYWxsU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24oc3RvcnlJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdzdG9yeS8nICsgc3RvcnlJZClcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdHJldHVybiBzdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hVc2VyU3RvcmllcyA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICd1c2VyLycgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBzdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KGJhc2VVcmwsIHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3J5LmRhdGFcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0JHN0YXRlLmdvKCdzaW5nbGVTdG9yeScsIHtzdG9yeUlkOiBzdG9yeS5pZH0pXG5cdFx0fSlcblx0XHRcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5kZWxldGUgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5kZWxldGUoYmFzZVVybCArIHN0b3J5LmlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChkZWxldGVkU3RvcnkpIHtcblx0XHRcdHJldHVybiBkZWxldGVkU3RvcnkuZGF0YTtcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uKGRlbGV0ZWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHZhciBjdXJyU3RvcnkgPSB0aGlzO1xuXHRcdGN1cnJTdG9yeS5kZWxldGUoc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3VyclN0b3J5LnB1Ymxpc2hTdG9yeShzdG9yeSk7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBzdG9yeUZhY3Rvcnk7XG5cbn0pIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciB1c2VyRmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS91c2Vycy9cIjtcblxuXG5cblx0dXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gdXNlci5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcblx0XHRcdHJldHVybiB1c2Vycy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gdXNlckZhY3Rvcnk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd5b3VyU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL3lvdXJzdG9yaWVzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy95b3VyL3lvdXItc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1lvdXJTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICBcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdZb3VyU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHVzZXIsICRyb290U2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UpIHtcblx0XG4gICAgaWYgKCRyb290U2NvcGUucGFnZVVwZGF0ZSkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICRyb290U2NvcGUucGFnZVVwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAkc2NvcGUudXNlciA9IHVzZXI7XG4gICAgJHNjb3BlLnB1Ymxpc2hlZFN0b3JpZXMgPSAkc2NvcGUudXNlci5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICByZXR1cm4gc3Rvcnkuc3RhdHVzID09PSAncHVibGlzaGVkJztcbiAgICB9KVxuICAgICRzY29wZS51bmZpbmlzaGVkU3RvcmllcyA9ICRzY29wZS51c2VyLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIHJldHVybiBzdG9yeS5zdGF0dXMgIT09ICdwdWJsaXNoZWQnO1xuICAgIH0pXG5cbiAgICAkc2NvcGUucmVzdW1lID0gZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgJHJvb3RTY29wZS5zdG9yeSA9IHN0b3J5O1xuICAgIH1cbn0pOyIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYnJvd3NlU3RvcmllcycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
