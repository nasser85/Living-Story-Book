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

app.directive('account', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/account/account.html'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJhY2NvdW50L2FjY291bnQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lc3NhZ2UvbWVzc2FnZS5kaXJlY3RpdmUuanMiLCJzdG9yeS9icm93c2Uuc3Rvcmllcy5qcyIsInN0b3J5L3NpbmdsZS5zdG9yeS5qcyIsInN0b3J5L3N0b3J5LmZhY3RvcnkuanMiLCJ1c2VyL3VzZXIuZmFjdG9yeS5qcyIsInlvdXIveW91ci5zdG9yaWVzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJ0ZW1wbGF0ZVVybCIsImNvbnRyb2xsZXIiLCJyZXNvbHZlIiwiYXV0aG9yVXNlciIsIlVzZXJGYWN0b3J5IiwiJHN0YXRlUGFyYW1zIiwiZmV0Y2hCeUlkIiwiYXV0aG9ySWQiLCIkc2NvcGUiLCJhdXRob3IiLCJTdG9yeUZhY3RvcnkiLCJzdWJtaXNzaW9uIiwibWVzc2FnZSIsIm1lc3NhZ2VzIiwic3RvcnkiLCJuZXdTdG9yeSIsInBhZ2VzIiwicG9zIiwibGVuZ3RoIiwidGl0bGUiLCJzdGF0dXMiLCJjb3Zlcl91cmwiLCJnZW5yZSIsInVzZXJJZCIsImltYWdlX3VybCIsImNvbnRlbnQiLCJpZCIsImltYWdlcyIsImkiLCJwdXNoIiwidG9TdHJpbmciLCJnZW5yZXMiLCJ0eXBlIiwiaW1hZ2UiLCJzZWxlY3RHZW5yZSIsImNvbnNvbGUiLCJsb2ciLCJzY3JvbGwiLCJnb0JhY2siLCJuZXh0UGFnZSIsInN1Ym1pdFRpdGxlIiwic3VibWl0UGFnZSIsInNlbGVjdENvdmVyIiwic2VsZWN0UGFnZUltYWdlIiwicHVibGlzaCIsInVwZGF0ZVN0b3J5IiwicHVibGlzaFN0b3J5IiwicGFnZVVwZGF0ZSIsInNhdmVTdG9yeSIsInN1Ym1pdFVybCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJmb2N1cyIsImNhbmNlbFN1Ym1pc3Npb24iLCJkZWxldGVQYWdlIiwic3BsaWNlIiwiRXJyb3IiLCJmYWN0b3J5IiwiaW8iLCJvcmlnaW4iLCJjb25zdGFudCIsImxvZ2luU3VjY2VzcyIsImxvZ2luRmFpbGVkIiwibG9nb3V0U3VjY2VzcyIsInNlc3Npb25UaW1lb3V0Iiwibm90QXV0aGVudGljYXRlZCIsIm5vdEF1dGhvcml6ZWQiLCIkcSIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCJyZXNwb25zZSIsIiRicm9hZGNhc3QiLCJyZWplY3QiLCIkaHR0cFByb3ZpZGVyIiwiaW50ZXJjZXB0b3JzIiwiJGluamVjdG9yIiwiZ2V0Iiwic2VydmljZSIsIiRodHRwIiwiU2Vzc2lvbiIsIm9uU3VjY2Vzc2Z1bExvZ2luIiwiY3JlYXRlIiwiZnJvbVNlcnZlciIsImNhdGNoIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJsb2dvdXQiLCJkZXN0cm95Iiwic2VsZiIsInNlc3Npb25JZCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0IiwidXNlcnMiLCJmZXRjaEFsbCIsImNyZWF0ZU5ldyIsImVycm9yIiwic2VuZExvZ2luIiwibG9naW5JbmZvIiwiYXV0aG9ycyIsImZpbHRlciIsInN0b3JpZXMiLCJicmVha3BvaW50cyIsImJyZWFrcG9pbnQiLCJzZXR0aW5ncyIsInNsaWRlc1RvU2hvdyIsInNsaWRlc1RvU2Nyb2xsIiwiaW5maW5pdGUiLCJkb3RzIiwiZm9yRWFjaCIsIndyaXRlciIsInN0b3J5SWQiLCJkZWxldGFiaWxpdHkiLCJnb29nbGVfaWQiLCJ2b2ljZSIsInNwZWVjaFN5bnRoZXNpcyIsImRlbGV0ZVN0b3J5IiwiZGVsZXRlIiwiY2FuY2VsRGVsZXRlIiwicmVhZEFsb3VkIiwidGV4dCIsImNhbmNlbCIsIm1zZyIsIlNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSIsInNwZWFrIiwic3RvcnlGYWN0b3J5IiwiYmFzZVVybCIsImZldGNoUHVibGlzaGVkIiwicHVibGlzaGVkU3RvcmllcyIsImFsbFN0b3JpZXMiLCJmZXRjaFVzZXJTdG9yaWVzIiwicHVibGlzaGVkU3RvcnkiLCJkZWxldGVkU3RvcnkiLCJkZWxldGVkIiwiY3VyclN0b3J5IiwidXNlckZhY3RvcnkiLCJ1bmZpbmlzaGVkU3RvcmllcyIsInJlc3VtZSIsImdldFJhbmRvbUZyb21BcnJheSIsImFyciIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsImdyZWV0aW5ncyIsImdldFJhbmRvbUdyZWV0aW5nIiwic2NvcGUiLCJsaW5rIiwiaXNMb2dnZWRJbiIsInNldFVzZXIiLCJyZW1vdmVVc2VyIiwiUmFuZG9tR3JlZXRpbmdzIiwiZ3JlZXRp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QSxFQUFBO0FBQ0E7QUFMQSxLQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ3NsaWNrJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRob3InLCB7XG4gICAgICAgIHVybDogJy9hdXRob3IvOmF1dGhvcklkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hdXRob3IvYXV0aG9yLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXV0aG9yQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JVc2VyOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5hdXRob3JJZCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0F1dGhvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvclVzZXIpIHtcblx0JHNjb3BlLmF1dGhvciA9IGF1dGhvclVzZXI7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY3JlYXRlL2NyZWF0ZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ3JlYXRlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCAkc3RhdGUsIHVzZXIsICRyb290U2NvcGUpIHtcblx0JHNjb3BlLnVzZXIgPSB1c2VyO1xuXHQkc2NvcGUuc3VibWlzc2lvbiA9IHt9O1xuXHQkc2NvcGUubWVzc2FnZSA9IG51bGw7XG5cdCRzY29wZS5tZXNzYWdlcyA9IFtcInNlbGVjdCBhIGdlbnJlIGZvciB5b3VyIG5ldyBzdG9yeVwiLCBcImRlc2lnbiB0aGUgY292ZXIgb2YgeW91ciBzdG9yeVwiLCBcImRlc2lnbiB5b3VyIGJvb2sncyBwYWdlc1wiLCBcIlBsZWFzZSB3YWl0IHdoaWxlIHlvdXIgYm9vayBpcyBwdWJsaXNoZWQuXCIsIFwiUGxlYXNlIHdhaXQgd2hpbGUgeW91ciBib29rIGlzIHNhdmVkLlwiLCAnRW50ZXIgdGhlIFVSTCBvZiB0aGUgcGljdHVyZSB0aGF0IHlvdSB3b3VsZCBsaWtlIHRvIHVzZS4nXVxuXHRpZiAoJHJvb3RTY29wZS5zdG9yeSkge1xuXHRcdCRzY29wZS5uZXdTdG9yeSA9ICRyb290U2NvcGUuc3Rvcnk7XG5cdFx0JHNjb3BlLnBhZ2VzID0gJHNjb3BlLm5ld1N0b3J5LnBhZ2VzO1xuXHRcdCRzY29wZS5wb3MgPSAkc2NvcGUucGFnZXMubGVuZ3RoICsgMTtcblx0fSBlbHNlIHtcblx0XHQkc2NvcGUubmV3U3RvcnkgPSB7XG5cdFx0XHR0aXRsZTogXCJNeSBOZXcgU3RvcnlcIixcblx0XHRcdHN0YXR1czogXCJpbmNvbXBsZXRlXCIsXG5cdFx0XHRjb3Zlcl91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRcdGdlbnJlOiBcIm5vbmVcIixcblx0XHRcdHVzZXJJZDogMSxcblx0XHRcdHBhZ2VzOiBudWxsXG5cdFx0fVxuXHRcdCRzY29wZS5wYWdlcyA9IFtcblx0XHRcdHtcblx0XHRcdFx0aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRcdGNvbnRlbnQ6IFwiXCJcblx0XHRcdH1cblx0XHRdO1xuXHRcdCRzY29wZS5wb3MgPSAwO1xuXHR9XG5cdFxuXHQkc2NvcGUuYXV0aG9yID0gXCJhbm9ueW1vdXNcIlxuXHRpZiAodXNlcikge1xuXHRcdCRzY29wZS5hdXRob3IgPSB1c2VyLm5hbWU7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnVzZXJJZCA9IHVzZXIuaWQ7IFxuXHR9XG5cdFxuXHQkc2NvcGUuaW1hZ2VzID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgMjY3OyBpKyspIHtcblxuXHRcdCRzY29wZS5pbWFnZXMucHVzaChpLnRvU3RyaW5nKCkgKyAnLnBuZycpO1xuXHR9XG5cdFxuXG5cdFxuXG5cdCRzY29wZS5nZW5yZXMgPSBbXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1NjaWVuY2UgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3NjaWVuY2UtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JlYWxpc3RpYyBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAncmVhbGlzdGljLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdOb25maWN0aW9uJyxcblx0XHRcdGltYWdlOiAnbm9uZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0ZhbnRhc3knLFxuXHRcdFx0aW1hZ2U6ICdmYW50YXN5LmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUm9tYW5jZScsXG5cdFx0XHRpbWFnZTogJ3JvbWFuY2UuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdUcmF2ZWwnLFxuXHRcdFx0aW1hZ2U6ICd0cmF2ZWwuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdDaGlsZHJlbicsXG5cdFx0XHRpbWFnZTogJ2NoaWxkcmVuLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnSG9ycm9yJyxcblx0XHRcdGltYWdlOiAnYWR1bHQuanBnJyxcblx0XHR9XG5cdF07XG5cblx0JHNjb3BlLnNlbGVjdEdlbnJlID0gZnVuY3Rpb24oZ2VucmUpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuZ2VucmUgPSBnZW5yZTtcblx0XHRjb25zb2xlLmxvZygkc2NvcGUubmV3U3RvcnkuZ2VucmUpO1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLmdvQmFjayA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cblx0JHNjb3BlLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0fVxuXG5cdCRzY29wZS5zdWJtaXRUaXRsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLnN1Ym1pdFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMucHVzaCh7aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsIGNvbnRlbnQ6ICcnfSk7XG5cdFx0JHNjb3BlLnBvcyA9ICRzY29wZS5wYWdlcy5sZW5ndGggKyAxO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5zZWxlY3RDb3ZlciA9IGZ1bmN0aW9uKHVybCkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5jb3Zlcl91cmwgPSB1cmw7XG5cdH1cblxuXHQkc2NvcGUuc2VsZWN0UGFnZUltYWdlID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLnBhZ2VzWyRzY29wZS5wb3MtMl0uaW1hZ2VfdXJsID0gdXJsO1xuXHR9XG5cblx0JHNjb3BlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoISRzY29wZS5tZXNzYWdlKSB7XG5cdFx0XHQkc2NvcGUubWVzc2FnZSA9ICRzY29wZS5tZXNzYWdlc1szXTtcblx0XHRcdCRzY29wZS5uZXdTdG9yeS5zdGF0dXMgPSBcInB1Ymxpc2hlZFwiO1xuXHRcdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdFx0aWYgKCRzY29wZS5uZXdTdG9yeS5pZCkge1xuXHRcdFx0XHRTdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkoJHNjb3BlLm5ld1N0b3J5KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpO1xuXHRcdFx0fVxuXHRcdFx0JHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHQkc2NvcGUuc2F2ZVN0b3J5ID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCEkc2NvcGUubWVzc2FnZSkge1xuXHRcdFx0JHNjb3BlLm1lc3NhZ2UgPSAkc2NvcGUubWVzc2FnZXNbNF07XG5cdFx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0XHRpZiAoJHNjb3BlLm5ld1N0b3J5LmlkKSB7XG5cdFx0XHRcdFN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KCRzY29wZS5uZXdTdG9yeSk7XG5cdFx0XHR9XG5cdFx0XHQkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdCRzY29wZS5zdWJtaXRVcmwgPSBmdW5jdGlvbigpIHtcblxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW5wdXRfdGV4dFwiKS5mb2N1cygpO1xuXHRcdCRzY29wZS5tZXNzYWdlID0gJHNjb3BlLm1lc3NhZ2VzWzVdO1xuXHRcdCRzY29wZS5zdWJtaXNzaW9uLmltYWdlID0gXCJcIjtcblx0XHR3aW5kb3cuc2Nyb2xsKDAsIDApO1xuXHR9XG5cdCRzY29wZS5jYW5jZWxTdWJtaXNzaW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuXHR9XG5cblx0JHNjb3BlLmRlbGV0ZVBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMuc3BsaWNlKCRzY29wZS5wb3MtMiwgMSk7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuZGlyZWN0aXZlKCdhY2NvdW50JywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWNjb3VudC9hY2NvdW50Lmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2dyZWV0aW5nJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZ3JlZXRpbmcvZ3JlZXRpbmcuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcnM6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgICAgXHR9LFxuICAgICAgICAgICAgdXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignSG9tZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHVzZXJzLCB1c2VyLCAkcm9vdFNjb3BlLCAkc3RhdGUpIHtcbiAgICAkc2NvcGUudXNlciA9IHVzZXI7XG4gICAgJHNjb3BlLmNyZWF0ZU5ldyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdFNjb3BlLnN0b3J5ID0gbnVsbDtcbiAgICB9XG5cbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCdtZXNzYWdlUHJvbXB0JywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbWVzc2FnZS9tZXNzYWdlLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jyb3dzZVN0b3JpZXMnLCB7XG4gICAgICAgIHVybDogJy9icm93c2UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3N0b3J5L2Jyb3dzZS1zdG9yaWVzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQnJvd3NlU3Rvcmllc0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YXV0aG9yczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdCcm93c2VTdG9yaWVzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgYXV0aG9ycykge1xuXHQkc2NvcGUuYXV0aG9ycyA9IGF1dGhvcnMuZmlsdGVyKGZ1bmN0aW9uKGF1dGhvcikge1xuICAgICAgICByZXR1cm4gYXV0aG9yLnN0b3JpZXMubGVuZ3RoO1xuICAgIH0pXG4gICAgJHNjb3BlLmJyZWFrcG9pbnRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgYnJlYWtwb2ludDogMTAyNCxcbiAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAyLFxuICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDIsXG4gICAgICAgICAgICBpbmZpbml0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGRvdHM6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBicmVha3BvaW50OiA3MDAsXG4gICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMSxcbiAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxXG4gICAgICAgICAgfVxuICAgIH1dO1xuICAgICRzY29wZS5zdG9yaWVzID0gW107XG4gICAgJHNjb3BlLmF1dGhvcnMuZm9yRWFjaChmdW5jdGlvbih3cml0ZXIpIHtcbiAgICAgICAgd3JpdGVyLnN0b3JpZXMuZm9yRWFjaChmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9yID0gd3JpdGVyLm5hbWU7XG4gICAgICAgICAgICBzdG9yeS5hdXRob3JJZCA9IHdyaXRlci5pZDtcbiAgICAgICAgICAgIGlmIChzdG9yeS5zdGF0dXMgPT09ICdwdWJsaXNoZWQnKSB7XG4gICAgICAgICAgICAgICAkc2NvcGUuc3Rvcmllcy5wdXNoKHN0b3J5KTsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIFxuICAgIHZhciBnZW5yZXMgPSBbJ1NjaWVuY2UgRmljdGlvbicsICdSZWFsaXN0aWMgRmljdGlvbicsICdOb25maWN0aW9uJywgJ0ZhbnRhc3knLCAnUm9tYW5jZScsICdUcmF2ZWwnLCAnQ2hpbGRyZW4nLCAnSG9ycm9yJ107XG4gICAgJHNjb3BlLmdlbnJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VucmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICRzY29wZS5nZW5yZXMucHVzaCgkc2NvcGUuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yeS5nZW5yZSA9PT0gZ2VucmVzW2ldO1xuICAgICAgICB9KSlcbiAgICB9XG4gICAgXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTdG9yeScsIHtcbiAgICAgICAgdXJsOiAnL3N0b3J5LzpzdG9yeUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9zaW5nbGUtc3RvcnkuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaW5nbGVTdG9yeUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0c3Rvcnk6IGZ1bmN0aW9uKFN0b3J5RmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU3RvcnlGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuc3RvcnlJZCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIGF1dGhvcjogZnVuY3Rpb24oVXNlckZhY3RvcnksIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZChzdG9yeS51c2VySWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpbmdsZVN0b3J5Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCBzdG9yeSwgYXV0aG9yLCB1c2VyLCAkcm9vdFNjb3BlKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG4gICAgJHNjb3BlLm5ld1N0b3J5ID0gc3Rvcnk7XG4gICAgJHNjb3BlLnBhZ2VzID0gc3RvcnkucGFnZXM7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuICAgICRzY29wZS5kZWxldGFiaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHVzZXIuaWQgPT09IGF1dGhvci5pZCB8fCB1c2VyLmdvb2dsZV9pZCA9PT0gXCIxMDU2OTA1Mzc2Nzk5NzQ3ODcwMDFcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgXG4gICAgfVxuICAgIHZhciB2b2ljZSA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgXG4gICAgJHNjb3BlLmRlbGV0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgd2luZG93LnNjcm9sbCgwLCAwKTtcbiAgICAgICAgaWYgKCRzY29wZS5tZXNzYWdlICE9PSBcIkRlbGV0aW5nIGJvb2suLi5cIikge1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgYm9vaz9cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2UgPSBcIkRlbGV0aW5nIGJvb2suLi5cIjtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIFN0b3J5RmFjdG9yeS5kZWxldGUoc3RvcnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IFxuICAgIH1cbiAgICAkc2NvcGUuY2FuY2VsRGVsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5tZXNzYWdlID0gbnVsbDtcbiAgICB9XG4gICAgJHNjb3BlLnJlYWRBbG91ZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICAgICAgICB2b2ljZS5jYW5jZWwoKTtcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UodGV4dCk7XG4gICAgICAgIHZvaWNlLnNwZWFrKG1zZyk7XG4gICAgfVxuXG59KTsiLCJhcHAuZmFjdG9yeSgnU3RvcnlGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciBzdG9yeUZhY3RvcnkgPSB7fTtcblx0dmFyIGJhc2VVcmwgPSBcIi9hcGkvc3Rvcmllcy9cIjtcblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hQdWJsaXNoZWQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdhbGwnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChhbGxTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gYWxsU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24oc3RvcnlJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdzdG9yeS8nICsgc3RvcnlJZClcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdHJldHVybiBzdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hVc2VyU3RvcmllcyA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICd1c2VyLycgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBzdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KGJhc2VVcmwsIHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3J5LmRhdGFcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0JHN0YXRlLmdvKCdzaW5nbGVTdG9yeScsIHtzdG9yeUlkOiBzdG9yeS5pZH0pXG5cdFx0fSlcblx0XHRcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5kZWxldGUgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5kZWxldGUoYmFzZVVybCArIHN0b3J5LmlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChkZWxldGVkU3RvcnkpIHtcblx0XHRcdHJldHVybiBkZWxldGVkU3RvcnkuZGF0YTtcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uKGRlbGV0ZWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHZhciBjdXJyU3RvcnkgPSB0aGlzO1xuXHRcdGN1cnJTdG9yeS5kZWxldGUoc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3VyclN0b3J5LnB1Ymxpc2hTdG9yeShzdG9yeSk7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBzdG9yeUZhY3Rvcnk7XG5cbn0pIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciB1c2VyRmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS91c2Vycy9cIjtcblxuXG5cblx0dXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gdXNlci5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcblx0XHRcdHJldHVybiB1c2Vycy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gdXNlckZhY3Rvcnk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd5b3VyU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL3lvdXJzdG9yaWVzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy95b3VyL3lvdXItc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1lvdXJTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICBcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdZb3VyU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHVzZXIsICRyb290U2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UpIHtcblx0XG4gICAgaWYgKCRyb290U2NvcGUucGFnZVVwZGF0ZSkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICRyb290U2NvcGUucGFnZVVwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICAkc2NvcGUuYnJlYWtwb2ludHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBicmVha3BvaW50OiAxMDI0LFxuICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDIsXG4gICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMixcbiAgICAgICAgICAgIGluZmluaXRlOiB0cnVlLFxuICAgICAgICAgICAgZG90czogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGJyZWFrcG9pbnQ6IDcwMCxcbiAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxuICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDFcbiAgICAgICAgICB9XG4gICAgfV07XG4gICAgXG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5wdWJsaXNoZWRTdG9yaWVzID0gJHNjb3BlLnVzZXIuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHN0b3J5LnN0YXR1cyA9PT0gJ3B1Ymxpc2hlZCc7XG4gICAgfSlcbiAgICAkc2NvcGUudW5maW5pc2hlZFN0b3JpZXMgPSAkc2NvcGUudXNlci5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICByZXR1cm4gc3Rvcnkuc3RhdHVzICE9PSAncHVibGlzaGVkJztcbiAgICB9KVxuXG4gICAgJHNjb3BlLnJlc3VtZSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICRyb290U2NvcGUuc3RvcnkgPSBzdG9yeTtcbiAgICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2Jyb3dzZVN0b3JpZXMnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
