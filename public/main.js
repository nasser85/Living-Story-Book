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
            authorUser: function authorUser(UserFactory, $stateParams) {
                return UserFactory.fetchById($stateParams.authorId);
            }
        }
    });
});

app.controller('AuthorCtrl', function ($scope, authorUser) {
    $scope.author = authorUser;
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
        window.scroll(0, 0);
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
    $scope.breakpoints = [{
        breakpoint: 1024,
        settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
            infinite: true,
            dots: true
        }
    }, {
        breakpoint: 700,
        settings: {
            slidesToShow: 1,
            slidesToScroll: 1
        }
    }];
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
        window.scroll(0, 0);
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
    $scope.breakpoints = [{
        breakpoint: 1024,
        settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
            infinite: true,
            dots: true
        }
    }, {
        breakpoint: 700,
        settings: {
            slidesToShow: 1,
            slidesToScroll: 1
        }
    }];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lc3NhZ2UvbWVzc2FnZS5kaXJlY3RpdmUuanMiLCJzdG9yeS9icm93c2Uuc3Rvcmllcy5qcyIsInN0b3J5L3NpbmdsZS5zdG9yeS5qcyIsInN0b3J5L3N0b3J5LmZhY3RvcnkuanMiLCJ1c2VyL3VzZXIuZmFjdG9yeS5qcyIsInlvdXIveW91ci5zdG9yaWVzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJ0ZW1wbGF0ZVVybCIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwiY29udHJvbGxlciIsInJlc29sdmUiLCJhdXRob3JVc2VyIiwiVXNlckZhY3RvcnkiLCIkc3RhdGVQYXJhbXMiLCJmZXRjaEJ5SWQiLCJhdXRob3JJZCIsIiRzY29wZSIsImF1dGhvciIsIlN0b3J5RmFjdG9yeSIsInN1Ym1pc3Npb24iLCJtZXNzYWdlIiwibWVzc2FnZXMiLCJzdG9yeSIsIm5ld1N0b3J5IiwicGFnZXMiLCJwb3MiLCJsZW5ndGgiLCJ0aXRsZSIsInN0YXR1cyIsImNvdmVyX3VybCIsImdlbnJlIiwidXNlcklkIiwiaW1hZ2VfdXJsIiwiY29udGVudCIsImlkIiwiaW1hZ2VzIiwiaSIsInB1c2giLCJ0b1N0cmluZyIsImdlbnJlcyIsInR5cGUiLCJpbWFnZSIsInNlbGVjdEdlbnJlIiwiY29uc29sZSIsImxvZyIsInNjcm9sbCIsImdvQmFjayIsIm5leHRQYWdlIiwic3VibWl0VGl0bGUiLCJzdWJtaXRQYWdlIiwic2VsZWN0Q292ZXIiLCJzZWxlY3RQYWdlSW1hZ2UiLCJwdWJsaXNoIiwidXBkYXRlU3RvcnkiLCJwdWJsaXNoU3RvcnkiLCJwYWdlVXBkYXRlIiwic2F2ZVN0b3J5Iiwic3VibWl0VXJsIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImZvY3VzIiwiY2FuY2VsU3VibWlzc2lvbiIsImRlbGV0ZVBhZ2UiLCJzcGxpY2UiLCJFcnJvciIsImZhY3RvcnkiLCJpbyIsIm9yaWdpbiIsImNvbnN0YW50IiwibG9naW5TdWNjZXNzIiwibG9naW5GYWlsZWQiLCJsb2dvdXRTdWNjZXNzIiwic2Vzc2lvblRpbWVvdXQiLCJub3RBdXRoZW50aWNhdGVkIiwibm90QXV0aG9yaXplZCIsIiRxIiwiQVVUSF9FVkVOVFMiLCJzdGF0dXNEaWN0IiwicmVzcG9uc2VFcnJvciIsInJlc3BvbnNlIiwiJGJyb2FkY2FzdCIsInJlamVjdCIsIiRodHRwUHJvdmlkZXIiLCJpbnRlcmNlcHRvcnMiLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwiY2F0Y2giLCJsb2dpbiIsImNyZWRlbnRpYWxzIiwicG9zdCIsImxvZ291dCIsImRlc3Ryb3kiLCJzZWxmIiwic2Vzc2lvbklkIiwidXNlcnMiLCJmZXRjaEFsbCIsImNyZWF0ZU5ldyIsImVycm9yIiwic2VuZExvZ2luIiwibG9naW5JbmZvIiwiYXV0aG9ycyIsImZpbHRlciIsInN0b3JpZXMiLCJicmVha3BvaW50cyIsImJyZWFrcG9pbnQiLCJzZXR0aW5ncyIsInNsaWRlc1RvU2hvdyIsInNsaWRlc1RvU2Nyb2xsIiwiaW5maW5pdGUiLCJkb3RzIiwiZm9yRWFjaCIsIndyaXRlciIsInN0b3J5SWQiLCJkZWxldGFiaWxpdHkiLCJnb29nbGVfaWQiLCJ2b2ljZSIsInNwZWVjaFN5bnRoZXNpcyIsImRlbGV0ZVN0b3J5IiwiZGVsZXRlIiwiY2FuY2VsRGVsZXRlIiwicmVhZEFsb3VkIiwidGV4dCIsImNhbmNlbCIsIm1zZyIsIlNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSIsInNwZWFrIiwic3RvcnlGYWN0b3J5IiwiYmFzZVVybCIsImZldGNoUHVibGlzaGVkIiwicHVibGlzaGVkU3RvcmllcyIsImFsbFN0b3JpZXMiLCJmZXRjaFVzZXJTdG9yaWVzIiwicHVibGlzaGVkU3RvcnkiLCJkZWxldGVkU3RvcnkiLCJkZWxldGVkIiwiY3VyclN0b3J5IiwidXNlckZhY3RvcnkiLCJ1bmZpbmlzaGVkU3RvcmllcyIsInJlc3VtZSIsImdldFJhbmRvbUZyb21BcnJheSIsImFyciIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImdyZWV0aW5ncyIsImdldFJhbmRvbUdyZWV0aW5nIiwic2NvcGUiLCJsaW5rIiwiaXNMb2dnZWRJbiIsInNldFVzZXIiLCJyZW1vdmVVc2VyIiwiUmFuZG9tR3JlZXRpbmdzIiwiZ3JlZXRp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QkFBQU4saUJBQUEsRUFBQTtBQUNBO0FBTEEsS0FBQTtBQVFBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdzbGljayddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWNjb3VudCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FjY291bnQvYWNjb3VudC5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRob3InLCB7XG4gICAgICAgIHVybDogJy9hdXRob3IvOmF1dGhvcklkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hdXRob3IvYXV0aG9yLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXV0aG9yQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JVc2VyOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5hdXRob3JJZCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0F1dGhvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvclVzZXIpIHtcblx0JHNjb3BlLmF1dGhvciA9IGF1dGhvclVzZXI7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY3JlYXRlL2NyZWF0ZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ3JlYXRlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCAkc3RhdGUsIHVzZXIsICRyb290U2NvcGUpIHtcblx0JHNjb3BlLnVzZXIgPSB1c2VyO1xuXHQkc2NvcGUuc3VibWlzc2lvbiA9IHt9O1xuXHQkc2NvcGUubWVzc2FnZSA9IG51bGw7XG5cdCRzY29wZS5tZXNzYWdlcyA9IFtcInNlbGVjdCBhIGdlbnJlIGZvciB5b3VyIG5ldyBzdG9yeVwiLCBcImRlc2lnbiB0aGUgY292ZXIgb2YgeW91ciBzdG9yeVwiLCBcImRlc2lnbiB5b3VyIGJvb2sncyBwYWdlc1wiLCBcIlBsZWFzZSB3YWl0IHdoaWxlIHlvdXIgYm9vayBpcyBwdWJsaXNoZWQuXCIsIFwiUGxlYXNlIHdhaXQgd2hpbGUgeW91ciBib29rIGlzIHNhdmVkLlwiLCAnRW50ZXIgdGhlIFVSTCBvZiB0aGUgcGljdHVyZSB0aGF0IHlvdSB3b3VsZCBsaWtlIHRvIHVzZS4nXVxuXHRpZiAoJHJvb3RTY29wZS5zdG9yeSkge1xuXHRcdCRzY29wZS5uZXdTdG9yeSA9ICRyb290U2NvcGUuc3Rvcnk7XG5cdFx0JHNjb3BlLnBhZ2VzID0gJHNjb3BlLm5ld1N0b3J5LnBhZ2VzO1xuXHRcdCRzY29wZS5wb3MgPSAkc2NvcGUucGFnZXMubGVuZ3RoICsgMTtcblx0fSBlbHNlIHtcblx0XHQkc2NvcGUubmV3U3RvcnkgPSB7XG5cdFx0XHR0aXRsZTogXCJNeSBOZXcgU3RvcnlcIixcblx0XHRcdHN0YXR1czogXCJpbmNvbXBsZXRlXCIsXG5cdFx0XHRjb3Zlcl91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRcdGdlbnJlOiBcIm5vbmVcIixcblx0XHRcdHVzZXJJZDogMSxcblx0XHRcdHBhZ2VzOiBudWxsXG5cdFx0fVxuXHRcdCRzY29wZS5wYWdlcyA9IFtcblx0XHRcdHtcblx0XHRcdFx0aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRcdGNvbnRlbnQ6IFwiXCJcblx0XHRcdH1cblx0XHRdO1xuXHRcdCRzY29wZS5wb3MgPSAwO1xuXHR9XG5cdFxuXHQkc2NvcGUuYXV0aG9yID0gXCJhbm9ueW1vdXNcIlxuXHRpZiAodXNlcikge1xuXHRcdCRzY29wZS5hdXRob3IgPSB1c2VyLm5hbWU7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnVzZXJJZCA9IHVzZXIuaWQ7IFxuXHR9XG5cdFxuXHQkc2NvcGUuaW1hZ2VzID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgMjY3OyBpKyspIHtcblxuXHRcdCRzY29wZS5pbWFnZXMucHVzaChpLnRvU3RyaW5nKCkgKyAnLnBuZycpO1xuXHR9XG5cdFxuXG5cdFxuXG5cdCRzY29wZS5nZW5yZXMgPSBbXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1NjaWVuY2UgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3NjaWVuY2UtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JlYWxpc3RpYyBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAncmVhbGlzdGljLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdOb25maWN0aW9uJyxcblx0XHRcdGltYWdlOiAnbm9uZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0ZhbnRhc3knLFxuXHRcdFx0aW1hZ2U6ICdmYW50YXN5LmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUm9tYW5jZScsXG5cdFx0XHRpbWFnZTogJ3JvbWFuY2UuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdUcmF2ZWwnLFxuXHRcdFx0aW1hZ2U6ICd0cmF2ZWwuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdDaGlsZHJlbicsXG5cdFx0XHRpbWFnZTogJ2NoaWxkcmVuLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnSG9ycm9yJyxcblx0XHRcdGltYWdlOiAnYWR1bHQuanBnJyxcblx0XHR9XG5cdF07XG5cblx0JHNjb3BlLnNlbGVjdEdlbnJlID0gZnVuY3Rpb24oZ2VucmUpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuZ2VucmUgPSBnZW5yZTtcblx0XHRjb25zb2xlLmxvZygkc2NvcGUubmV3U3RvcnkuZ2VucmUpO1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLmdvQmFjayA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cblx0JHNjb3BlLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0fVxuXG5cdCRzY29wZS5zdWJtaXRUaXRsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLnN1Ym1pdFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMucHVzaCh7aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsIGNvbnRlbnQ6ICcnfSk7XG5cdFx0JHNjb3BlLnBvcyA9ICRzY29wZS5wYWdlcy5sZW5ndGggKyAxO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5zZWxlY3RDb3ZlciA9IGZ1bmN0aW9uKHVybCkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5jb3Zlcl91cmwgPSB1cmw7XG5cdH1cblxuXHQkc2NvcGUuc2VsZWN0UGFnZUltYWdlID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLnBhZ2VzWyRzY29wZS5wb3MtMl0uaW1hZ2VfdXJsID0gdXJsO1xuXHR9XG5cblx0JHNjb3BlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoISRzY29wZS5tZXNzYWdlKSB7XG5cdFx0XHQkc2NvcGUubWVzc2FnZSA9ICRzY29wZS5tZXNzYWdlc1szXTtcblx0XHRcdCRzY29wZS5uZXdTdG9yeS5zdGF0dXMgPSBcInB1Ymxpc2hlZFwiO1xuXHRcdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdFx0aWYgKCRzY29wZS5uZXdTdG9yeS5pZCkge1xuXHRcdFx0XHRTdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkoJHNjb3BlLm5ld1N0b3J5KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpO1xuXHRcdFx0fVxuXHRcdFx0JHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHQkc2NvcGUuc2F2ZVN0b3J5ID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCEkc2NvcGUubWVzc2FnZSkge1xuXHRcdFx0JHNjb3BlLm1lc3NhZ2UgPSAkc2NvcGUubWVzc2FnZXNbNF07XG5cdFx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0XHRpZiAoJHNjb3BlLm5ld1N0b3J5LmlkKSB7XG5cdFx0XHRcdFN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KCRzY29wZS5uZXdTdG9yeSk7XG5cdFx0XHR9XG5cdFx0XHQkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdCRzY29wZS5zdWJtaXRVcmwgPSBmdW5jdGlvbigpIHtcblxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW5wdXRfdGV4dFwiKS5mb2N1cygpO1xuXHRcdCRzY29wZS5tZXNzYWdlID0gJHNjb3BlLm1lc3NhZ2VzWzVdO1xuXHRcdCRzY29wZS5zdWJtaXNzaW9uLmltYWdlID0gXCJcIjtcblx0XHR3aW5kb3cuc2Nyb2xsKDAsIDApO1xuXHR9XG5cdCRzY29wZS5jYW5jZWxTdWJtaXNzaW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuXHR9XG5cblx0JHNjb3BlLmRlbGV0ZVBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMuc3BsaWNlKCRzY29wZS5wb3MtMiwgMSk7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncmVldGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2dyZWV0aW5nL2dyZWV0aW5nLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXJzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VycywgdXNlciwgJHJvb3RTY29wZSwgJHN0YXRlKSB7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5jcmVhdGVOZXcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RTY29wZS5zdG9yeSA9IG51bGw7XG4gICAgfVxuXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbWVzc2FnZVByb21wdCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL21lc3NhZ2UvbWVzc2FnZS5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdicm93c2VTdG9yaWVzJywge1xuICAgICAgICB1cmw6ICcvYnJvd3NlJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9icm93c2Utc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Jyb3dzZVN0b3JpZXNDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGF1dGhvcnM6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQnJvd3NlU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcnMpIHtcblx0JHNjb3BlLmF1dGhvcnMgPSBhdXRob3JzLmZpbHRlcihmdW5jdGlvbihhdXRob3IpIHtcbiAgICAgICAgcmV0dXJuIGF1dGhvci5zdG9yaWVzLmxlbmd0aDtcbiAgICB9KVxuICAgICRzY29wZS5icmVha3BvaW50cyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGJyZWFrcG9pbnQ6IDEwMjQsXG4gICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMixcbiAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAyLFxuICAgICAgICAgICAgaW5maW5pdGU6IHRydWUsXG4gICAgICAgICAgICBkb3RzOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgYnJlYWtwb2ludDogNzAwLFxuICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDEsXG4gICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMVxuICAgICAgICAgIH1cbiAgICB9XTtcbiAgICAkc2NvcGUuc3RvcmllcyA9IFtdO1xuICAgICRzY29wZS5hdXRob3JzLmZvckVhY2goZnVuY3Rpb24od3JpdGVyKSB7XG4gICAgICAgIHdyaXRlci5zdG9yaWVzLmZvckVhY2goZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvciA9IHdyaXRlci5uYW1lO1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9ySWQgPSB3cml0ZXIuaWQ7XG4gICAgICAgICAgICBpZiAoc3Rvcnkuc3RhdHVzID09PSAncHVibGlzaGVkJykge1xuICAgICAgICAgICAgICAgJHNjb3BlLnN0b3JpZXMucHVzaChzdG9yeSk7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBcbiAgICB2YXIgZ2VucmVzID0gWydTY2llbmNlIEZpY3Rpb24nLCAnUmVhbGlzdGljIEZpY3Rpb24nLCAnTm9uZmljdGlvbicsICdGYW50YXN5JywgJ1JvbWFuY2UnLCAnVHJhdmVsJywgJ0NoaWxkcmVuJywgJ0hvcnJvciddO1xuICAgICRzY29wZS5nZW5yZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbnJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAkc2NvcGUuZ2VucmVzLnB1c2goJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IGdlbnJlc1tpXTtcbiAgICAgICAgfSkpXG4gICAgfVxuICAgIFxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU3RvcnknLCB7XG4gICAgICAgIHVybDogJy9zdG9yeS86c3RvcnlJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3Rvcnkvc2luZ2xlLXN0b3J5Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2luZ2xlU3RvcnlDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHN0b3J5OiBmdW5jdGlvbihTdG9yeUZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuICAgICAgICBcdFx0cmV0dXJuIFN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnN0b3J5SWQpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICBhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoc3RvcnkudXNlcklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaW5nbGVTdG9yeUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgc3RvcnksIGF1dGhvciwgdXNlciwgJHJvb3RTY29wZSkge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xuICAgICRzY29wZS5uZXdTdG9yeSA9IHN0b3J5O1xuICAgICRzY29wZS5wYWdlcyA9IHN0b3J5LnBhZ2VzO1xuICAgICRzY29wZS5tZXNzYWdlID0gbnVsbDtcbiAgICAkc2NvcGUuZGVsZXRhYmlsaXR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh1c2VyLmlkID09PSBhdXRob3IuaWQgfHwgdXNlci5nb29nbGVfaWQgPT09IFwiMTA1NjkwNTM3Njc5OTc0Nzg3MDAxXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IFxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIFxuICAgIH1cbiAgICB2YXIgdm9pY2UgPSB3aW5kb3cuc3BlZWNoU3ludGhlc2lzO1xuICAgIFxuICAgICRzY29wZS5kZWxldGVTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIHdpbmRvdy5zY3JvbGwoMCwgMCk7XG4gICAgICAgIGlmICgkc2NvcGUubWVzc2FnZSAhPT0gXCJEZWxldGluZyBib29rLi4uXCIpIHtcbiAgICAgICAgICAgIGlmICghJHNjb3BlLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUubWVzc2FnZSA9IFwiQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGlzIGJvb2s/XCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gXCJEZWxldGluZyBib29rLi4uXCI7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBTdG9yeUZhY3RvcnkuZGVsZXRlKHN0b3J5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBcbiAgICB9XG4gICAgJHNjb3BlLmNhbmNlbERlbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUubWVzc2FnZSA9IG51bGw7XG4gICAgfVxuICAgICRzY29wZS5yZWFkQWxvdWQgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgICAgICAgdm9pY2UuY2FuY2VsKCk7XG4gICAgICAgIHZhciBtc2cgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlKHRleHQpO1xuICAgICAgICB2b2ljZS5zcGVhayhtc2cpO1xuICAgIH1cblxufSk7IiwiYXBwLmZhY3RvcnkoJ1N0b3J5RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUpe1xuXHR2YXIgc3RvcnlGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3N0b3JpZXMvXCI7XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoUHVibGlzaGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnYWxsJylcblx0XHQudGhlbihmdW5jdGlvbiAoYWxsU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIGFsbFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uKHN0b3J5SWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAnc3RvcnkvJyArIHN0b3J5SWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHRyZXR1cm4gc3RvcnkuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoVXNlclN0b3JpZXMgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAndXNlci8nICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gc3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdChiYXNlVXJsLCBzdG9yeSlcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3RvcnkpIHtcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yeS5kYXRhXG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdCRzdGF0ZS5nbygnc2luZ2xlU3RvcnknLCB7c3RvcnlJZDogc3RvcnkuaWR9KVxuXHRcdH0pXG5cdFx0XG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZGVsZXRlID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAuZGVsZXRlKGJhc2VVcmwgKyBzdG9yeS5pZClcblx0XHQudGhlbihmdW5jdGlvbiAoZGVsZXRlZFN0b3J5KSB7XG5cdFx0XHRyZXR1cm4gZGVsZXRlZFN0b3J5LmRhdGE7XG5cdFx0fSlcblx0XHQudGhlbihmdW5jdGlvbihkZWxldGVkKSB7XG5cdFx0XHQkc3RhdGUuZ28oJ2hvbWUnKTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHR2YXIgY3VyclN0b3J5ID0gdGhpcztcblx0XHRjdXJyU3RvcnkuZGVsZXRlKHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGN1cnJTdG9yeS5wdWJsaXNoU3Rvcnkoc3RvcnkpO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gc3RvcnlGYWN0b3J5O1xuXG59KSIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUpe1xuXHR2YXIgdXNlckZhY3RvcnkgPSB7fTtcblx0dmFyIGJhc2VVcmwgPSBcIi9hcGkvdXNlcnMvXCI7XG5cblxuXG5cdHVzZXJGYWN0b3J5LmZldGNoQnlJZCA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArIHVzZXJJZClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcikge1xuXHRcdFx0cmV0dXJuIHVzZXIuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0dXNlckZhY3RvcnkuZmV0Y2hBbGwgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVzZXJzKSB7XG5cdFx0XHRyZXR1cm4gdXNlcnMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIHVzZXJGYWN0b3J5O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgneW91clN0b3JpZXMnLCB7XG4gICAgICAgIHVybDogJy95b3Vyc3RvcmllcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMveW91ci95b3VyLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdZb3VyU3Rvcmllc0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignWW91clN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VyLCAkcm9vdFNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlKSB7XG5cdFxuICAgIGlmICgkcm9vdFNjb3BlLnBhZ2VVcGRhdGUpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgJHNjb3BlLmJyZWFrcG9pbnRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgYnJlYWtwb2ludDogMTAyNCxcbiAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAyLFxuICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDIsXG4gICAgICAgICAgICBpbmZpbml0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGRvdHM6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBicmVha3BvaW50OiA3MDAsXG4gICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMSxcbiAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxXG4gICAgICAgICAgfVxuICAgIH1dO1xuICAgIFxuICAgICRzY29wZS51c2VyID0gdXNlcjtcbiAgICAkc2NvcGUucHVibGlzaGVkU3RvcmllcyA9ICRzY29wZS51c2VyLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIHJldHVybiBzdG9yeS5zdGF0dXMgPT09ICdwdWJsaXNoZWQnO1xuICAgIH0pXG4gICAgJHNjb3BlLnVuZmluaXNoZWRTdG9yaWVzID0gJHNjb3BlLnVzZXIuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHN0b3J5LnN0YXR1cyAhPT0gJ3B1Ymxpc2hlZCc7XG4gICAgfSlcblxuICAgICRzY29wZS5yZXN1bWUgPSBmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAkcm9vdFNjb3BlLnN0b3J5ID0gc3Rvcnk7XG4gICAgfVxufSk7IiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdicm93c2VTdG9yaWVzJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
