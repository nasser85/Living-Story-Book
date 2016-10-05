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
app.directive('account', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/account/account.html'
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJhY2NvdW50L2FjY291bnQuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lc3NhZ2UvbWVzc2FnZS5kaXJlY3RpdmUuanMiLCJzdG9yeS9icm93c2Uuc3Rvcmllcy5qcyIsInN0b3J5L3NpbmdsZS5zdG9yeS5qcyIsInN0b3J5L3N0b3J5LmZhY3RvcnkuanMiLCJ1c2VyL3VzZXIuZmFjdG9yeS5qcyIsInlvdXIveW91ci5zdG9yaWVzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJ0ZW1wbGF0ZVVybCIsImNvbnRyb2xsZXIiLCJyZXNvbHZlIiwiYXV0aG9yIiwiVXNlckZhY3RvcnkiLCIkc3RhdGVQYXJhbXMiLCJmZXRjaEJ5SWQiLCJhdXRob3JJZCIsIiRzY29wZSIsImRpcmVjdGl2ZSIsInJlc3RyaWN0IiwiU3RvcnlGYWN0b3J5Iiwic3VibWlzc2lvbiIsIm1lc3NhZ2UiLCJtZXNzYWdlcyIsInN0b3J5IiwibmV3U3RvcnkiLCJwYWdlcyIsInBvcyIsImxlbmd0aCIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJpbWFnZV91cmwiLCJjb250ZW50IiwiaWQiLCJpbWFnZXMiLCJpIiwicHVzaCIsInRvU3RyaW5nIiwiZ2VucmVzIiwidHlwZSIsImltYWdlIiwic2VsZWN0R2VucmUiLCJjb25zb2xlIiwibG9nIiwic2Nyb2xsIiwiZ29CYWNrIiwibmV4dFBhZ2UiLCJzdWJtaXRUaXRsZSIsInN1Ym1pdFBhZ2UiLCJzZWxlY3RDb3ZlciIsInNlbGVjdFBhZ2VJbWFnZSIsInB1Ymxpc2giLCJ1cGRhdGVTdG9yeSIsInB1Ymxpc2hTdG9yeSIsInBhZ2VVcGRhdGUiLCJzYXZlU3RvcnkiLCJzdWJtaXRVcmwiLCJjYW5jZWxTdWJtaXNzaW9uIiwiZGVsZXRlUGFnZSIsInNwbGljZSIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0IiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsIiRpbmplY3RvciIsImdldCIsInNlcnZpY2UiLCIkaHR0cCIsIlNlc3Npb24iLCJvblN1Y2Nlc3NmdWxMb2dpbiIsImNyZWF0ZSIsImZyb21TZXJ2ZXIiLCJjYXRjaCIsImxvZ2luIiwiY3JlZGVudGlhbHMiLCJwb3N0IiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJ1c2VycyIsImZldGNoQWxsIiwiY3JlYXRlTmV3IiwiZXJyb3IiLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJhdXRob3JzIiwiZmlsdGVyIiwic3RvcmllcyIsImZvckVhY2giLCJ3cml0ZXIiLCJzdG9yeUlkIiwiZGVsZXRhYmlsaXR5IiwiZ29vZ2xlX2lkIiwidm9pY2UiLCJzcGVlY2hTeW50aGVzaXMiLCJkZWxldGVTdG9yeSIsImRlbGV0ZSIsImNhbmNlbERlbGV0ZSIsInJlYWRBbG91ZCIsInRleHQiLCJjYW5jZWwiLCJtc2ciLCJTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UiLCJzcGVhayIsInN0b3J5RmFjdG9yeSIsImJhc2VVcmwiLCJmZXRjaFB1Ymxpc2hlZCIsInB1Ymxpc2hlZFN0b3JpZXMiLCJhbGxTdG9yaWVzIiwiZmV0Y2hVc2VyU3RvcmllcyIsInB1Ymxpc2hlZFN0b3J5IiwiZGVsZXRlZFN0b3J5IiwiZGVsZXRlZCIsImN1cnJTdG9yeSIsInVzZXJGYWN0b3J5IiwidW5maW5pc2hlZFN0b3JpZXMiLCJyZXN1bWUiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFF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R0FEQTtBQUVBVixxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBO0FDQUFoQyxJQUFBeUMsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBbUksZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQWxJLGtCQUFBLEdBREE7QUFFQVYscUJBQUEseURBRkE7QUFHQXdJLGNBQUEsY0FBQUQsS0FBQSxFQUFBO0FBQ0FBLGtCQUFBTSxRQUFBLEdBQUFELGdCQUFBTixpQkFBQSxFQUFBO0FBQ0E7QUFMQSxLQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ3NsaWNrJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRob3InLCB7XG4gICAgICAgIHVybDogJy9hdXRob3IvOmF1dGhvcklkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hdXRob3IvYXV0aG9yLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXV0aG9yQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmF1dGhvcklkKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQXV0aG9yQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgYXV0aG9yKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG59KSIsImFwcC5kaXJlY3RpdmUoJ2FjY291bnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hY2NvdW50L2FjY291bnQuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY3JlYXRlJywge1xuICAgICAgICB1cmw6ICcvY3JlYXRlJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jcmVhdGUvY3JlYXRlLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQ3JlYXRlQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICBcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDcmVhdGVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBTdG9yeUZhY3RvcnksICRzdGF0ZSwgdXNlciwgJHJvb3RTY29wZSkge1xuXHQkc2NvcGUudXNlciA9IHVzZXI7XG5cdCRzY29wZS5zdWJtaXNzaW9uID0ge307XG5cdCRzY29wZS5tZXNzYWdlID0gbnVsbDtcblx0JHNjb3BlLm1lc3NhZ2VzID0gW1wic2VsZWN0IGEgZ2VucmUgZm9yIHlvdXIgbmV3IHN0b3J5XCIsIFwiZGVzaWduIHRoZSBjb3ZlciBvZiB5b3VyIHN0b3J5XCIsIFwiZGVzaWduIHlvdXIgYm9vaydzIHBhZ2VzXCIsIFwiUGxlYXNlIHdhaXQgd2hpbGUgeW91ciBib29rIGlzIHB1Ymxpc2hlZC5cIiwgXCJQbGVhc2Ugd2FpdCB3aGlsZSB5b3VyIGJvb2sgaXMgc2F2ZWQuXCIsICdFbnRlciB0aGUgVVJMIG9mIHRoZSBwaWN0dXJlIHRoYXQgeW91IHdvdWxkIGxpa2UgdG8gdXNlLiddXG5cdGlmICgkcm9vdFNjb3BlLnN0b3J5KSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5ID0gJHJvb3RTY29wZS5zdG9yeTtcblx0XHQkc2NvcGUucGFnZXMgPSAkc2NvcGUubmV3U3RvcnkucGFnZXM7XG5cdFx0JHNjb3BlLnBvcyA9ICRzY29wZS5wYWdlcy5sZW5ndGggKyAxO1xuXHR9IGVsc2Uge1xuXHRcdCRzY29wZS5uZXdTdG9yeSA9IHtcblx0XHRcdHRpdGxlOiBcIk15IE5ldyBTdG9yeVwiLFxuXHRcdFx0c3RhdHVzOiBcImluY29tcGxldGVcIixcblx0XHRcdGNvdmVyX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0Z2VucmU6IFwibm9uZVwiLFxuXHRcdFx0dXNlcklkOiAxLFxuXHRcdFx0cGFnZXM6IG51bGxcblx0XHR9XG5cdFx0JHNjb3BlLnBhZ2VzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRcdFx0Y29udGVudDogXCJcIlxuXHRcdFx0fVxuXHRcdF07XG5cdFx0JHNjb3BlLnBvcyA9IDA7XG5cdH1cblx0XG5cdCRzY29wZS5hdXRob3IgPSBcImFub255bW91c1wiXG5cdGlmICh1c2VyKSB7XG5cdFx0JHNjb3BlLmF1dGhvciA9IHVzZXIubmFtZTtcblx0XHQkc2NvcGUubmV3U3RvcnkudXNlcklkID0gdXNlci5pZDsgXG5cdH1cblx0XG5cdCRzY29wZS5pbWFnZXMgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCAyNjc7IGkrKykge1xuXG5cdFx0JHNjb3BlLmltYWdlcy5wdXNoKGkudG9TdHJpbmcoKSArICcucG5nJyk7XG5cdH1cblx0XG5cblx0XG5cblx0JHNjb3BlLmdlbnJlcyA9IFtcblx0XHR7XG5cdFx0XHR0eXBlOiAnU2NpZW5jZSBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAnc2NpZW5jZS1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUmVhbGlzdGljIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdyZWFsaXN0aWMtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ05vbmZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdub25maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnRmFudGFzeScsXG5cdFx0XHRpbWFnZTogJ2ZhbnRhc3kuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSb21hbmNlJyxcblx0XHRcdGltYWdlOiAncm9tYW5jZS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1RyYXZlbCcsXG5cdFx0XHRpbWFnZTogJ3RyYXZlbC5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0NoaWxkcmVuJyxcblx0XHRcdGltYWdlOiAnY2hpbGRyZW4uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdIb3Jyb3InLFxuXHRcdFx0aW1hZ2U6ICdhZHVsdC5qcGcnLFxuXHRcdH1cblx0XTtcblxuXHQkc2NvcGUuc2VsZWN0R2VucmUgPSBmdW5jdGlvbihnZW5yZSkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5nZW5yZSA9IGdlbnJlO1xuXHRcdGNvbnNvbGUubG9nKCRzY29wZS5uZXdTdG9yeS5nZW5yZSk7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuZ29CYWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxuXHQkc2NvcGUubmV4dFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHR9XG5cblx0JHNjb3BlLnN1Ym1pdFRpdGxlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wYWdlcy5wdXNoKHtpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIiwgY29udGVudDogJyd9KTtcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLnNlbGVjdENvdmVyID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmNvdmVyX3VybCA9IHVybDtcblx0fVxuXG5cdCRzY29wZS5zZWxlY3RQYWdlSW1hZ2UgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUucGFnZXNbJHNjb3BlLnBvcy0yXS5pbWFnZV91cmwgPSB1cmw7XG5cdH1cblxuXHQkc2NvcGUucHVibGlzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghJHNjb3BlLm1lc3NhZ2UpIHtcblx0XHRcdCRzY29wZS5tZXNzYWdlID0gJHNjb3BlLm1lc3NhZ2VzWzNdO1xuXHRcdFx0JHNjb3BlLm5ld1N0b3J5LnN0YXR1cyA9IFwicHVibGlzaGVkXCI7XG5cdFx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0XHRpZiAoJHNjb3BlLm5ld1N0b3J5LmlkKSB7XG5cdFx0XHRcdFN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KCRzY29wZS5uZXdTdG9yeSk7XG5cdFx0XHR9XG5cdFx0XHQkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdCRzY29wZS5zYXZlU3RvcnkgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoISRzY29wZS5tZXNzYWdlKSB7XG5cdFx0XHQkc2NvcGUubWVzc2FnZSA9ICRzY29wZS5tZXNzYWdlc1s0XTtcblx0XHRcdCRzY29wZS5uZXdTdG9yeS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblx0XHRcdGlmICgkc2NvcGUubmV3U3RvcnkuaWQpIHtcblx0XHRcdFx0U3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5KCRzY29wZS5uZXdTdG9yeSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KTtcblx0XHRcdH1cblx0XHRcdCRyb290U2NvcGUucGFnZVVwZGF0ZSA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblx0JHNjb3BlLnN1Ym1pdFVybCA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5tZXNzYWdlID0gJHNjb3BlLm1lc3NhZ2VzWzVdO1xuXHRcdCRzY29wZS5zdWJtaXNzaW9uLmltYWdlID0gXCJcIjtcblx0fVxuXHQkc2NvcGUuY2FuY2VsU3VibWlzc2lvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5tZXNzYWdlID0gbnVsbDtcblx0fVxuXG5cdCRzY29wZS5kZWxldGVQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnNwbGljZSgkc2NvcGUucG9zLTIsIDEpO1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JlZXRpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ncmVldGluZy9ncmVldGluZy5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdIb21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgdXNlcnMsIHVzZXIsICRyb290U2NvcGUsICRzdGF0ZSkge1xuICAgICRzY29wZS51c2VyID0gdXNlcjtcbiAgICAkc2NvcGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290U2NvcGUuc3RvcnkgPSBudWxsO1xuICAgIH1cblxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ21lc3NhZ2VQcm9tcHQnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9tZXNzYWdlL21lc3NhZ2UuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYnJvd3NlU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2Jyb3dzZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3RvcnkvYnJvd3NlLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdCcm93c2VTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Jyb3dzZVN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3JzKSB7XG5cdCRzY29wZS5hdXRob3JzID0gYXV0aG9ycy5maWx0ZXIoZnVuY3Rpb24oYXV0aG9yKSB7XG4gICAgICAgIHJldHVybiBhdXRob3Iuc3Rvcmllcy5sZW5ndGg7XG4gICAgfSlcbiAgICBcbiAgICAkc2NvcGUuc3RvcmllcyA9IFtdO1xuICAgICRzY29wZS5hdXRob3JzLmZvckVhY2goZnVuY3Rpb24od3JpdGVyKSB7XG4gICAgICAgIHdyaXRlci5zdG9yaWVzLmZvckVhY2goZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvciA9IHdyaXRlci5uYW1lO1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9ySWQgPSB3cml0ZXIuaWQ7XG4gICAgICAgICAgICBpZiAoc3Rvcnkuc3RhdHVzID09PSAncHVibGlzaGVkJykge1xuICAgICAgICAgICAgICAgJHNjb3BlLnN0b3JpZXMucHVzaChzdG9yeSk7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBcbiAgICB2YXIgZ2VucmVzID0gWydTY2llbmNlIEZpY3Rpb24nLCAnUmVhbGlzdGljIEZpY3Rpb24nLCAnTm9uZmljdGlvbicsICdGYW50YXN5JywgJ1JvbWFuY2UnLCAnVHJhdmVsJywgJ0NoaWxkcmVuJywgJ0hvcnJvciddO1xuICAgICRzY29wZS5nZW5yZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbnJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAkc2NvcGUuZ2VucmVzLnB1c2goJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IGdlbnJlc1tpXTtcbiAgICAgICAgfSkpXG4gICAgfVxuICAgIFxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU3RvcnknLCB7XG4gICAgICAgIHVybDogJy9zdG9yeS86c3RvcnlJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3Rvcnkvc2luZ2xlLXN0b3J5Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2luZ2xlU3RvcnlDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHN0b3J5OiBmdW5jdGlvbihTdG9yeUZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuICAgICAgICBcdFx0cmV0dXJuIFN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnN0b3J5SWQpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICBhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoc3RvcnkudXNlcklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaW5nbGVTdG9yeUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgc3RvcnksIGF1dGhvciwgdXNlciwgJHJvb3RTY29wZSkge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xuICAgICRzY29wZS5uZXdTdG9yeSA9IHN0b3J5O1xuICAgICRzY29wZS5wYWdlcyA9IHN0b3J5LnBhZ2VzO1xuICAgICRzY29wZS5tZXNzYWdlID0gbnVsbDtcbiAgICAkc2NvcGUuZGVsZXRhYmlsaXR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh1c2VyLmlkID09PSBhdXRob3IuaWQgfHwgdXNlci5nb29nbGVfaWQgPT09IFwiMTA1NjkwNTM3Njc5OTc0Nzg3MDAxXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IFxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIFxuICAgIH1cbiAgICB2YXIgdm9pY2UgPSB3aW5kb3cuc3BlZWNoU3ludGhlc2lzO1xuICAgIFxuICAgICRzY29wZS5kZWxldGVTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIGlmICgkc2NvcGUubWVzc2FnZSAhPT0gXCJEZWxldGluZyBib29rLi4uXCIpIHtcbiAgICAgICAgICAgIGlmICghJHNjb3BlLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZSA9IFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGlzIGJvb2s/XCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gXCJEZWxldGluZyBib29rLi4uXCI7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBTdG9yeUZhY3RvcnkuZGVsZXRlKHN0b3J5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBcbiAgICB9XG4gICAgJHNjb3BlLmNhbmNlbERlbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUubWVzc2FnZSA9IG51bGw7XG4gICAgfVxuICAgICRzY29wZS5yZWFkQWxvdWQgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgICAgICAgdm9pY2UuY2FuY2VsKCk7XG4gICAgICAgIHZhciBtc2cgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlKHRleHQpO1xuICAgICAgICB2b2ljZS5zcGVhayhtc2cpO1xuICAgIH1cblxufSk7IiwiYXBwLmZhY3RvcnkoJ1N0b3J5RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUpe1xuXHR2YXIgc3RvcnlGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3N0b3JpZXMvXCI7XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoUHVibGlzaGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnYWxsJylcblx0XHQudGhlbihmdW5jdGlvbiAoYWxsU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIGFsbFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uKHN0b3J5SWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnc3RvcnkvJyArIHN0b3J5SWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHRyZXR1cm4gc3RvcnkuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoVXNlclN0b3JpZXMgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAndXNlci8nICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gc3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdChiYXNlVXJsLCBzdG9yeSlcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3RvcnkpIHtcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yeS5kYXRhXG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdCRzdGF0ZS5nbygnc2luZ2xlU3RvcnknLCB7c3RvcnlJZDogc3RvcnkuaWR9KVxuXHRcdH0pXG5cdFx0XG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZGVsZXRlID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAuZGVsZXRlKGJhc2VVcmwgKyBzdG9yeS5pZClcblx0XHQudGhlbihmdW5jdGlvbiAoZGVsZXRlZFN0b3J5KSB7XG5cdFx0XHRyZXR1cm4gZGVsZXRlZFN0b3J5LmRhdGE7XG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbihkZWxldGVkKSB7XG5cdFx0XHQkc3RhdGUuZ28oJ2hvbWUnKTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHR2YXIgY3VyclN0b3J5ID0gdGhpcztcblx0XHRjdXJyU3RvcnkuZGVsZXRlKHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGN1cnJTdG9yeS5wdWJsaXNoU3Rvcnkoc3RvcnkpO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gc3RvcnlGYWN0b3J5O1xuXG59KSIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUpe1xuXHR2YXIgdXNlckZhY3RvcnkgPSB7fTtcblx0dmFyIGJhc2VVcmwgPSBcIi9hcGkvdXNlcnMvXCI7XG5cblxuXG5cdHVzZXJGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArIHVzZXJJZClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcikge1xuXHRcdFx0cmV0dXJuIHVzZXIuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0dXNlckZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVzZXJzKSB7XG5cdFx0XHRyZXR1cm4gdXNlcnMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIHVzZXJGYWN0b3J5O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgneW91clN0b3JpZXMnLCB7XG4gICAgICAgIHVybDogJy95b3Vyc3RvcmllcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMveW91ci95b3VyLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdZb3VyU3Rvcmllc0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignWW91clN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VyLCAkcm9vdFNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlKSB7XG5cdFxuICAgIGlmICgkcm9vdFNjb3BlLnBhZ2VVcGRhdGUpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5wdWJsaXNoZWRTdG9yaWVzID0gJHNjb3BlLnVzZXIuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHN0b3J5LnN0YXR1cyA9PT0gJ3B1Ymxpc2hlZCc7XG4gICAgfSlcbiAgICAkc2NvcGUudW5maW5pc2hlZFN0b3JpZXMgPSAkc2NvcGUudXNlci5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICByZXR1cm4gc3Rvcnkuc3RhdHVzICE9PSAncHVibGlzaGVkJztcbiAgICB9KVxuXG4gICAgJHNjb3BlLnJlc3VtZSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICRyb290U2NvcGUuc3RvcnkgPSBzdG9yeTtcbiAgICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYnJvd3NlU3RvcmllcycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
