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
    $scope.message = null;
    $scope.messages = ["select a genre for your new story", "design the cover of your story book", "design your book's pages", "Please wait while your book is published.", "Please wait while your book is saved."];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lc3NhZ2UvbWVzc2FnZS5kaXJlY3RpdmUuanMiLCJzdG9yeS9icm93c2Uuc3Rvcmllcy5qcyIsInN0b3J5L3NpbmdsZS5zdG9yeS5qcyIsInN0b3J5L3N0b3J5LmZhY3RvcnkuanMiLCJ1c2VyL3VzZXIuZmFjdG9yeS5qcyIsInlvdXIveW91ci5zdG9yaWVzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJ0ZW1wbGF0ZVVybCIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwiY29udHJvbGxlciIsInJlc29sdmUiLCJhdXRob3IiLCJVc2VyRmFjdG9yeSIsIiRzdGF0ZVBhcmFtcyIsImZldGNoQnlJZCIsImF1dGhvcklkIiwiJHNjb3BlIiwiU3RvcnlGYWN0b3J5IiwibWVzc2FnZSIsIm1lc3NhZ2VzIiwic3RvcnkiLCJuZXdTdG9yeSIsInBhZ2VzIiwicG9zIiwibGVuZ3RoIiwidGl0bGUiLCJzdGF0dXMiLCJjb3Zlcl91cmwiLCJnZW5yZSIsInVzZXJJZCIsImltYWdlX3VybCIsImNvbnRlbnQiLCJpZCIsImltYWdlcyIsImkiLCJwdXNoIiwidG9TdHJpbmciLCJnZW5yZXMiLCJ0eXBlIiwiaW1hZ2UiLCJzZWxlY3RHZW5yZSIsImNvbnNvbGUiLCJsb2ciLCJzY3JvbGwiLCJnb0JhY2siLCJuZXh0UGFnZSIsInN1Ym1pdFRpdGxlIiwic3VibWl0UGFnZSIsInNlbGVjdENvdmVyIiwic2VsZWN0UGFnZUltYWdlIiwicHVibGlzaCIsInVwZGF0ZVN0b3J5IiwicHVibGlzaFN0b3J5IiwicGFnZVVwZGF0ZSIsInNhdmVTdG9yeSIsImRlbGV0ZVBhZ2UiLCJzcGxpY2UiLCJFcnJvciIsImZhY3RvcnkiLCJpbyIsIm9yaWdpbiIsImNvbnN0YW50IiwibG9naW5TdWNjZXNzIiwibG9naW5GYWlsZWQiLCJsb2dvdXRTdWNjZXNzIiwic2Vzc2lvblRpbWVvdXQiLCJub3RBdXRoZW50aWNhdGVkIiwibm90QXV0aG9yaXplZCIsIiRxIiwiQVVUSF9FVkVOVFMiLCJzdGF0dXNEaWN0IiwicmVzcG9uc2VFcnJvciIsInJlc3BvbnNlIiwiJGJyb2FkY2FzdCIsInJlamVjdCIsIiRodHRwUHJvdmlkZXIiLCJpbnRlcmNlcHRvcnMiLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwiY2F0Y2giLCJsb2dpbiIsImNyZWRlbnRpYWxzIiwicG9zdCIsImxvZ291dCIsImRlc3Ryb3kiLCJzZWxmIiwic2Vzc2lvbklkIiwidXNlcnMiLCJmZXRjaEFsbCIsImNyZWF0ZU5ldyIsImVycm9yIiwic2VuZExvZ2luIiwibG9naW5JbmZvIiwiYXV0aG9ycyIsImZpbHRlciIsInN0b3JpZXMiLCJmb3JFYWNoIiwid3JpdGVyIiwic3RvcnlJZCIsImRlbGV0YWJpbGl0eSIsImdvb2dsZV9pZCIsInZvaWNlIiwic3BlZWNoU3ludGhlc2lzIiwiZGVsZXRlU3RvcnkiLCJkZWxldGUiLCJjYW5jZWxEZWxldGUiLCJyZWFkQWxvdWQiLCJ0ZXh0IiwiY2FuY2VsIiwibXNnIiwiU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIiwic3BlYWsiLCJzdG9yeUZhY3RvcnkiLCJiYXNlVXJsIiwiZmV0Y2hQdWJsaXNoZWQiLCJwdWJsaXNoZWRTdG9yaWVzIiwiYWxsU3RvcmllcyIsImZldGNoVXNlclN0b3JpZXMiLCJwdWJsaXNoZWRTdG9yeSIsImRlbGV0ZWRTdG9yeSIsImRlbGV0ZWQiLCJjdXJyU3RvcnkiLCJ1c2VyRmFjdG9yeSIsInVuZmluaXNoZWRTdG9yaWVzIiwicmVzdW1lIiwiZ2V0UmFuZG9tRnJvbUFycmF5IiwiYXJyIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiZ3JlZXRpbmdzIiwiZ2V0UmFuZG9tR3JlZXRpbmciLCJzY29wZSIsImxpbmsiLCJpc0xvZ2dlZEluIiwic2V0VXNlciIsInJlbW92ZVVzZXIiLCJSYW5kb21HcmVldGluZ3MiLCJncmVldGluZyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0FBLE9BQUFDLEdBQUEsR0FBQUMsUUFBQUMsTUFBQSxDQUFBLHVCQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7O0FBRUFGLElBQUFHLE1BQUEsQ0FBQSxVQUFBQyxrQkFBQSxFQUFBQyxpQkFBQSxF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c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdzbGljayddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWNjb3VudCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FjY291bnQvYWNjb3VudC5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRob3InLCB7XG4gICAgICAgIHVybDogJy9hdXRob3IvOmF1dGhvcklkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hdXRob3IvYXV0aG9yLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXV0aG9yQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmF1dGhvcklkKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQXV0aG9yQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgYXV0aG9yKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY3JlYXRlL2NyZWF0ZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ3JlYXRlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCAkc3RhdGUsIHVzZXIsICRyb290U2NvcGUpIHtcblx0JHNjb3BlLnVzZXIgPSB1c2VyO1xuXHQkc2NvcGUubWVzc2FnZSA9IG51bGw7XG5cdCRzY29wZS5tZXNzYWdlcyA9IFtcInNlbGVjdCBhIGdlbnJlIGZvciB5b3VyIG5ldyBzdG9yeVwiLCBcImRlc2lnbiB0aGUgY292ZXIgb2YgeW91ciBzdG9yeSBib29rXCIsIFwiZGVzaWduIHlvdXIgYm9vaydzIHBhZ2VzXCIsIFwiUGxlYXNlIHdhaXQgd2hpbGUgeW91ciBib29rIGlzIHB1Ymxpc2hlZC5cIiwgXCJQbGVhc2Ugd2FpdCB3aGlsZSB5b3VyIGJvb2sgaXMgc2F2ZWQuXCJdXG5cdGlmICgkcm9vdFNjb3BlLnN0b3J5KSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5ID0gJHJvb3RTY29wZS5zdG9yeTtcblx0XHQkc2NvcGUucGFnZXMgPSAkc2NvcGUubmV3U3RvcnkucGFnZXM7XG5cdFx0JHNjb3BlLnBvcyA9ICRzY29wZS5wYWdlcy5sZW5ndGggKyAxO1xuXHR9IGVsc2Uge1xuXHRcdCRzY29wZS5uZXdTdG9yeSA9IHtcblx0XHRcdHRpdGxlOiBcIk15IE5ldyBTdG9yeVwiLFxuXHRcdFx0c3RhdHVzOiBcImluY29tcGxldGVcIixcblx0XHRcdGNvdmVyX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0Z2VucmU6IFwibm9uZVwiLFxuXHRcdFx0dXNlcklkOiAxLFxuXHRcdFx0cGFnZXM6IG51bGxcblx0XHR9XG5cdFx0JHNjb3BlLnBhZ2VzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRcdFx0Y29udGVudDogXCJcIlxuXHRcdFx0fVxuXHRcdF07XG5cdFx0JHNjb3BlLnBvcyA9IDA7XG5cdH1cblx0XG5cdCRzY29wZS5hdXRob3IgPSBcImFub255bW91c1wiXG5cdGlmICh1c2VyKSB7XG5cdFx0JHNjb3BlLmF1dGhvciA9IHVzZXIubmFtZTtcblx0XHQkc2NvcGUubmV3U3RvcnkudXNlcklkID0gdXNlci5pZDsgXG5cdH1cblx0XG5cdCRzY29wZS5pbWFnZXMgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCAyNjc7IGkrKykge1xuXG5cdFx0JHNjb3BlLmltYWdlcy5wdXNoKGkudG9TdHJpbmcoKSArICcucG5nJyk7XG5cdH1cblx0XG5cblx0XG5cblx0JHNjb3BlLmdlbnJlcyA9IFtcblx0XHR7XG5cdFx0XHR0eXBlOiAnU2NpZW5jZSBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAnc2NpZW5jZS1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUmVhbGlzdGljIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdyZWFsaXN0aWMtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ05vbmZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdub25maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnRmFudGFzeScsXG5cdFx0XHRpbWFnZTogJ2ZhbnRhc3kuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSb21hbmNlJyxcblx0XHRcdGltYWdlOiAncm9tYW5jZS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1RyYXZlbCcsXG5cdFx0XHRpbWFnZTogJ3RyYXZlbC5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0NoaWxkcmVuJyxcblx0XHRcdGltYWdlOiAnY2hpbGRyZW4uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdIb3Jyb3InLFxuXHRcdFx0aW1hZ2U6ICdhZHVsdC5qcGcnLFxuXHRcdH1cblx0XTtcblxuXHQkc2NvcGUuc2VsZWN0R2VucmUgPSBmdW5jdGlvbihnZW5yZSkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5nZW5yZSA9IGdlbnJlO1xuXHRcdGNvbnNvbGUubG9nKCRzY29wZS5uZXdTdG9yeS5nZW5yZSk7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuZ29CYWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxuXHQkc2NvcGUubmV4dFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHR9XG5cblx0JHNjb3BlLnN1Ym1pdFRpdGxlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wYWdlcy5wdXNoKHtpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIiwgY29udGVudDogJyd9KTtcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLnNlbGVjdENvdmVyID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmNvdmVyX3VybCA9IHVybDtcblx0fVxuXG5cdCRzY29wZS5zZWxlY3RQYWdlSW1hZ2UgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUucGFnZXNbJHNjb3BlLnBvcy0yXS5pbWFnZV91cmwgPSB1cmw7XG5cdH1cblxuXHQkc2NvcGUucHVibGlzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghJHNjb3BlLm1lc3NhZ2UpIHtcblx0XHRcdCRzY29wZS5tZXNzYWdlID0gJHNjb3BlLm1lc3NhZ2VzWzNdO1xuXHRcdFx0JHNjb3BlLm5ld1N0b3J5LnN0YXR1cyA9IFwicHVibGlzaGVkXCI7XG5cdFx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0XHRpZiAoJHNjb3BlLm5ld1N0b3J5LmlkKSB7XG5cdFx0XHRcdFN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KCRzY29wZS5uZXdTdG9yeSk7XG5cdFx0XHR9XG5cdFx0XHQkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdCRzY29wZS5zYXZlU3RvcnkgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoISRzY29wZS5tZXNzYWdlKSB7XG5cdFx0XHQkc2NvcGUubWVzc2FnZSA9ICRzY29wZS5tZXNzYWdlc1s0XTtcblx0XHRcdCRzY29wZS5uZXdTdG9yeS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblx0XHRcdGlmICgkc2NvcGUubmV3U3RvcnkuaWQpIHtcblx0XHRcdFx0U3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5KCRzY29wZS5uZXdTdG9yeSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KTtcblx0XHRcdH1cblx0XHRcdCRyb290U2NvcGUucGFnZVVwZGF0ZSA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblx0JHNjb3BlLmRlbGV0ZVBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMuc3BsaWNlKCRzY29wZS5wb3MtMiwgMSk7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncmVldGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2dyZWV0aW5nL2dyZWV0aW5nLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXJzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VycywgdXNlciwgJHJvb3RTY29wZSwgJHN0YXRlKSB7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5jcmVhdGVOZXcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RTY29wZS5zdG9yeSA9IG51bGw7XG4gICAgfVxuXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbWVzc2FnZVByb21wdCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL21lc3NhZ2UvbWVzc2FnZS5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdicm93c2VTdG9yaWVzJywge1xuICAgICAgICB1cmw6ICcvYnJvd3NlJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9icm93c2Utc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Jyb3dzZVN0b3JpZXNDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGF1dGhvcnM6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQnJvd3NlU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcnMpIHtcblx0JHNjb3BlLmF1dGhvcnMgPSBhdXRob3JzLmZpbHRlcihmdW5jdGlvbihhdXRob3IpIHtcbiAgICAgICAgcmV0dXJuIGF1dGhvci5zdG9yaWVzLmxlbmd0aDtcbiAgICB9KVxuICAgIFxuICAgICRzY29wZS5zdG9yaWVzID0gW107XG4gICAgJHNjb3BlLmF1dGhvcnMuZm9yRWFjaChmdW5jdGlvbih3cml0ZXIpIHtcbiAgICAgICAgd3JpdGVyLnN0b3JpZXMuZm9yRWFjaChmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9yID0gd3JpdGVyLm5hbWU7XG4gICAgICAgICAgICBzdG9yeS5hdXRob3JJZCA9IHdyaXRlci5pZDtcbiAgICAgICAgICAgIGlmIChzdG9yeS5zdGF0dXMgPT09ICdwdWJsaXNoZWQnKSB7XG4gICAgICAgICAgICAgICAkc2NvcGUuc3Rvcmllcy5wdXNoKHN0b3J5KTsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIFxuICAgIHZhciBnZW5yZXMgPSBbJ1NjaWVuY2UgRmljdGlvbicsICdSZWFsaXN0aWMgRmljdGlvbicsICdOb25maWN0aW9uJywgJ0ZhbnRhc3knLCAnUm9tYW5jZScsICdUcmF2ZWwnLCAnQ2hpbGRyZW4nLCAnSG9ycm9yJ107XG4gICAgJHNjb3BlLmdlbnJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VucmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICRzY29wZS5nZW5yZXMucHVzaCgkc2NvcGUuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yeS5nZW5yZSA9PT0gZ2VucmVzW2ldO1xuICAgICAgICB9KSlcbiAgICB9XG4gICAgXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTdG9yeScsIHtcbiAgICAgICAgdXJsOiAnL3N0b3J5LzpzdG9yeUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9zaW5nbGUtc3RvcnkuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaW5nbGVTdG9yeUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0c3Rvcnk6IGZ1bmN0aW9uKFN0b3J5RmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU3RvcnlGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuc3RvcnlJZCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIGF1dGhvcjogZnVuY3Rpb24oVXNlckZhY3RvcnksIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZChzdG9yeS51c2VySWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpbmdsZVN0b3J5Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCBzdG9yeSwgYXV0aG9yLCB1c2VyLCAkcm9vdFNjb3BlKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG4gICAgJHNjb3BlLm5ld1N0b3J5ID0gc3Rvcnk7XG4gICAgJHNjb3BlLnBhZ2VzID0gc3RvcnkucGFnZXM7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuICAgICRzY29wZS5kZWxldGFiaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHVzZXIuaWQgPT09IGF1dGhvci5pZCB8fCB1c2VyLmdvb2dsZV9pZCA9PT0gXCIxMDU2OTA1Mzc2Nzk5NzQ3ODcwMDFcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgXG4gICAgfVxuICAgIHZhciB2b2ljZSA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgXG4gICAgJHNjb3BlLmRlbGV0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgaWYgKCRzY29wZS5tZXNzYWdlICE9PSBcIkRlbGV0aW5nIGJvb2suLi5cIikge1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgYm9vaz9cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2UgPSBcIkRlbGV0aW5nIGJvb2suLi5cIjtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIFN0b3J5RmFjdG9yeS5kZWxldGUoc3RvcnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IFxuICAgIH1cbiAgICAkc2NvcGUuY2FuY2VsRGVsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5tZXNzYWdlID0gbnVsbDtcbiAgICB9XG4gICAgJHNjb3BlLnJlYWRBbG91ZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICAgICAgICB2b2ljZS5jYW5jZWwoKTtcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UodGV4dCk7XG4gICAgICAgIHZvaWNlLnNwZWFrKG1zZyk7XG4gICAgfVxuXG59KTsiLCJhcHAuZmFjdG9yeSgnU3RvcnlGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciBzdG9yeUZhY3RvcnkgPSB7fTtcblx0dmFyIGJhc2VVcmwgPSBcIi9hcGkvc3Rvcmllcy9cIjtcblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hQdWJsaXNoZWQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdhbGwnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChhbGxTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gYWxsU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24oc3RvcnlJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdzdG9yeS8nICsgc3RvcnlJZClcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdHJldHVybiBzdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hVc2VyU3RvcmllcyA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICd1c2VyLycgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBzdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KGJhc2VVcmwsIHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3J5LmRhdGFcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0JHN0YXRlLmdvKCdzaW5nbGVTdG9yeScsIHtzdG9yeUlkOiBzdG9yeS5pZH0pXG5cdFx0fSlcblx0XHRcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5kZWxldGUgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5kZWxldGUoYmFzZVVybCArIHN0b3J5LmlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChkZWxldGVkU3RvcnkpIHtcblx0XHRcdHJldHVybiBkZWxldGVkU3RvcnkuZGF0YTtcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uKGRlbGV0ZWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHZhciBjdXJyU3RvcnkgPSB0aGlzO1xuXHRcdGN1cnJTdG9yeS5kZWxldGUoc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3VyclN0b3J5LnB1Ymxpc2hTdG9yeShzdG9yeSk7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBzdG9yeUZhY3Rvcnk7XG5cbn0pIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciB1c2VyRmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS91c2Vycy9cIjtcblxuXG5cblx0dXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gdXNlci5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcblx0XHRcdHJldHVybiB1c2Vycy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gdXNlckZhY3Rvcnk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd5b3VyU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL3lvdXJzdG9yaWVzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy95b3VyL3lvdXItc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1lvdXJTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICBcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdZb3VyU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHVzZXIsICRyb290U2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UpIHtcblx0XG4gICAgaWYgKCRyb290U2NvcGUucGFnZVVwZGF0ZSkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICRyb290U2NvcGUucGFnZVVwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAkc2NvcGUudXNlciA9IHVzZXI7XG4gICAgJHNjb3BlLnB1Ymxpc2hlZFN0b3JpZXMgPSAkc2NvcGUudXNlci5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICByZXR1cm4gc3Rvcnkuc3RhdHVzID09PSAncHVibGlzaGVkJztcbiAgICB9KVxuICAgICRzY29wZS51bmZpbmlzaGVkU3RvcmllcyA9ICRzY29wZS51c2VyLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIHJldHVybiBzdG9yeS5zdGF0dXMgIT09ICdwdWJsaXNoZWQnO1xuICAgIH0pXG5cbiAgICAkc2NvcGUucmVzdW1lID0gZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgJHJvb3RTY29wZS5zdG9yeSA9IHN0b3J5O1xuICAgIH1cbn0pOyIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYnJvd3NlU3RvcmllcycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
