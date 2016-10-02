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
    $scope.messages = ["select a genre for your new story", "design the cover of your story book", "design your book's pages"];
    if ($rootScope.story) {
        $scope.newStory = $rootScope.story;
        $scope.pages = $scope.newStory.pages;
        $scope.pages.push({
            image_url: "not-available.jpg",
            content: ""
        });
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
        console.log($scope.pages);
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
        if ($scope.newStory.id) {
            StoryFactory.updateStory($scope.newStory);
        } else {
            StoryFactory.publishStory($scope.newStory);
        }
        $rootScope.pageUpdate = true;
    };

    $scope.saveStory = function () {
        $scope.newStory.pages = $scope.pages;
        console.log($scope.newStory);
        console.log($scope.pages);
        if ($scope.newStory.id) {
            console.log('updating from save');
            StoryFactory.updateStory($scope.newStory);
        } else {
            StoryFactory.publishStory($scope.newStory);
        }
        $rootScope.pageUpdate = true;
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
    $scope.deletability = function () {
        if (user.id === author.id || user.google_id === 105690537679974787001) {
            return true;
        }
        return false;
    };
    var voice = window.speechSynthesis;

    $scope.deleteStory = function (story) {
        $rootScope.pageUpdate = true;
        StoryFactory.delete(story);
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

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsInN0b3J5L2Jyb3dzZS5zdG9yaWVzLmpzIiwic3Rvcnkvc2luZ2xlLnN0b3J5LmpzIiwic3Rvcnkvc3RvcnkuZmFjdG9yeS5qcyIsInlvdXIveW91ci5zdG9yaWVzLmpzIiwidXNlci91c2VyLmZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsIm90aGVyd2lzZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsInJ1biIsIiRyb290U2NvcGUiLCJBdXRoU2VydmljZSIsIiRzdGF0ZSIsImRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgiLCJzdGF0ZSIsImRhdGEiLCJhdXRoZW50aWNhdGUiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImlzQXV0aGVudGljYXRlZCIsInByZXZlbnREZWZhdWx0IiwiZ2V0TG9nZ2VkSW5Vc2VyIiwidGhlbiIsInVzZXIiLCJnbyIsIm5hbWUiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInRlbXBsYXRlVXJsIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwicmVzb2x2ZSIsImF1dGhvciIsIlVzZXJGYWN0b3J5IiwiJHN0YXRlUGFyYW1zIiwiZmV0Y2hCeUlkIiwiYXV0aG9ySWQiLCIkc2NvcGUiLCJTdG9yeUZhY3RvcnkiLCJtZXNzYWdlcyIsInN0b3J5IiwibmV3U3RvcnkiLCJwYWdlcyIsInB1c2giLCJpbWFnZV91cmwiLCJjb250ZW50IiwicG9zIiwibGVuZ3RoIiwidGl0bGUiLCJzdGF0dXMiLCJjb3Zlcl91cmwiLCJnZW5yZSIsInVzZXJJZCIsImlkIiwiaW1hZ2VzIiwiaSIsInRvU3RyaW5nIiwiZ2VucmVzIiwidHlwZSIsImltYWdlIiwic2VsZWN0R2VucmUiLCJjb25zb2xlIiwibG9nIiwic2Nyb2xsIiwiZ29CYWNrIiwibmV4dFBhZ2UiLCJzdWJtaXRUaXRsZSIsInN1Ym1pdFBhZ2UiLCJzZWxlY3RDb3ZlciIsInNlbGVjdFBhZ2VJbWFnZSIsInB1Ymxpc2giLCJ1cGRhdGVTdG9yeSIsInB1Ymxpc2hTdG9yeSIsInBhZ2VVcGRhdGUiLCJzYXZlU3RvcnkiLCJkZWxldGVQYWdlIiwic3BsaWNlIiwiRXJyb3IiLCJmYWN0b3J5IiwiaW8iLCJvcmlnaW4iLCJjb25zdGFudCIsImxvZ2luU3VjY2VzcyIsImxvZ2luRmFpbGVkIiwibG9nb3V0U3VjY2VzcyIsInNlc3Npb25UaW1lb3V0Iiwibm90QXV0aGVudGljYXRlZCIsIm5vdEF1dGhvcml6ZWQiLCIkcSIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCJyZXNwb25zZSIsIiRicm9hZGNhc3QiLCJyZWplY3QiLCIkaHR0cFByb3ZpZGVyIiwiaW50ZXJjZXB0b3JzIiwiJGluamVjdG9yIiwiZ2V0Iiwic2VydmljZSIsIiRodHRwIiwiU2Vzc2lvbiIsIm9uU3VjY2Vzc2Z1bExvZ2luIiwiY3JlYXRlIiwiZnJvbVNlcnZlciIsImNhdGNoIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJ1c2VycyIsImZldGNoQWxsIiwiY3JlYXRlTmV3IiwiZXJyb3IiLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJhdXRob3JzIiwiZmlsdGVyIiwic3RvcmllcyIsImZvckVhY2giLCJ3cml0ZXIiLCJzdG9yeUlkIiwiZGVsZXRhYmlsaXR5IiwiZ29vZ2xlX2lkIiwidm9pY2UiLCJzcGVlY2hTeW50aGVzaXMiLCJkZWxldGVTdG9yeSIsImRlbGV0ZSIsInJlYWRBbG91ZCIsInRleHQiLCJjYW5jZWwiLCJtc2ciLCJTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UiLCJzcGVhayIsInN0b3J5RmFjdG9yeSIsImJhc2VVcmwiLCJmZXRjaFB1Ymxpc2hlZCIsInB1Ymxpc2hlZFN0b3JpZXMiLCJhbGxTdG9yaWVzIiwiZmV0Y2hVc2VyU3RvcmllcyIsInB1Ymxpc2hlZFN0b3J5IiwiZGVsZXRlZFN0b3J5IiwiZGVsZXRlZCIsImN1cnJTdG9yeSIsInVuZmluaXNoZWRTdG9yaWVzIiwicmVzdW1lIiwidXNlckZhY3RvcnkiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNB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QUFBMkUsWUFBQVAsWUFBQSxFQUFBK0UsT0FBQTtBQUNBMUosdUJBQUFPLEdBQUEsQ0FBQTJFLFlBQUFMLGFBQUEsRUFBQThFLFVBQUE7QUFDQTNKLHVCQUFBTyxHQUFBLENBQUEyRSxZQUFBSixjQUFBLEVBQUE2RSxVQUFBO0FBRUE7O0FBbENBLEtBQUE7QUFzQ0EsQ0F4Q0E7O0FDQUF2SyxJQUFBOEIsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBMEksZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQXpJLGtCQUFBLEdBREE7QUFFQUMscUJBQUEseURBRkE7QUFHQW9JLGNBQUEsY0FBQUQsS0FBQSxFQUFBO0FBQ0FBLGtCQUFBTSxRQUFBLEdBQUFELGdCQUFBTixpQkFBQSxFQUFBO0FBQ0E7QUFMQSxLQUFBO0FBUUEsQ0FWQTtBQ0FBbEssSUFBQThCLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQUMsa0JBQUEsR0FEQTtBQUVBQyxxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnc2xpY2snXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FjY291bnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hY2NvdW50L2FjY291bnQuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aG9yJywge1xuICAgICAgICB1cmw6ICcvYXV0aG9yLzphdXRob3JJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYXV0aG9yL2F1dGhvci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0F1dGhvckN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YXV0aG9yOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5hdXRob3JJZCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0F1dGhvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcikge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjcmVhdGUnLCB7XG4gICAgICAgIHVybDogJy9jcmVhdGUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NyZWF0ZS9jcmVhdGUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDcmVhdGVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NyZWF0ZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgJHN0YXRlLCB1c2VyLCAkcm9vdFNjb3BlKSB7XG5cdCRzY29wZS51c2VyID0gdXNlcjtcblx0JHNjb3BlLm1lc3NhZ2VzID0gW1wic2VsZWN0IGEgZ2VucmUgZm9yIHlvdXIgbmV3IHN0b3J5XCIsIFwiZGVzaWduIHRoZSBjb3ZlciBvZiB5b3VyIHN0b3J5IGJvb2tcIiwgXCJkZXNpZ24geW91ciBib29rJ3MgcGFnZXNcIl1cblx0aWYgKCRyb290U2NvcGUuc3RvcnkpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkgPSAkcm9vdFNjb3BlLnN0b3J5O1xuXHRcdCRzY29wZS5wYWdlcyA9ICRzY29wZS5uZXdTdG9yeS5wYWdlcztcblx0XHQkc2NvcGUucGFnZXMucHVzaCh7XG5cdFx0XHRcdGltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0XHRjb250ZW50OiBcIlwiXG5cdFx0XHR9KTtcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdH0gZWxzZSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5ID0ge1xuXHRcdFx0dGl0bGU6IFwiTXkgTmV3IFN0b3J5XCIsXG5cdFx0XHRzdGF0dXM6IFwiaW5jb21wbGV0ZVwiLFxuXHRcdFx0Y292ZXJfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRnZW5yZTogXCJub25lXCIsXG5cdFx0XHR1c2VySWQ6IDEsXG5cdFx0XHRwYWdlczogbnVsbFxuXHRcdH1cblx0XHQkc2NvcGUucGFnZXMgPSBbXG5cdFx0XHR7XG5cdFx0XHRcdGltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0XHRjb250ZW50OiBcIlwiXG5cdFx0XHR9XG5cdFx0XTtcblx0XHQkc2NvcGUucG9zID0gMDtcblx0fVxuXHRcblx0JHNjb3BlLmF1dGhvciA9IFwiYW5vbnltb3VzXCJcblx0aWYgKHVzZXIpIHtcblx0XHQkc2NvcGUuYXV0aG9yID0gdXNlci5uYW1lO1xuXHRcdCRzY29wZS5uZXdTdG9yeS51c2VySWQgPSB1c2VyLmlkOyBcblx0fVxuXHRcblx0JHNjb3BlLmltYWdlcyA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IDI2NzsgaSsrKSB7XG5cblx0XHQkc2NvcGUuaW1hZ2VzLnB1c2goaS50b1N0cmluZygpICsgJy5wbmcnKTtcblx0fVxuXHRcblxuXHRcblxuXHQkc2NvcGUuZ2VucmVzID0gW1xuXHRcdHtcblx0XHRcdHR5cGU6ICdTY2llbmNlIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdzY2llbmNlLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSZWFsaXN0aWMgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3JlYWxpc3RpYy1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnTm9uZmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ25vbmZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdGYW50YXN5Jyxcblx0XHRcdGltYWdlOiAnZmFudGFzeS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JvbWFuY2UnLFxuXHRcdFx0aW1hZ2U6ICdyb21hbmNlLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnVHJhdmVsJyxcblx0XHRcdGltYWdlOiAndHJhdmVsLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnQ2hpbGRyZW4nLFxuXHRcdFx0aW1hZ2U6ICdjaGlsZHJlbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0hvcnJvcicsXG5cdFx0XHRpbWFnZTogJ2FkdWx0LmpwZycsXG5cdFx0fVxuXHRdO1xuXG5cdCRzY29wZS5zZWxlY3RHZW5yZSA9IGZ1bmN0aW9uKGdlbnJlKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmdlbnJlID0gZ2VucmU7XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLm5ld1N0b3J5LmdlbnJlKTtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5nb0JhY2sgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zIC0tO1xuXHR9XG5cdCRzY29wZS5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0VGl0bGUgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXHQkc2NvcGUuc3VibWl0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wYWdlcy5wdXNoKHtpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIiwgY29udGVudDogJyd9KTtcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLnBhZ2VzKTtcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblx0JHNjb3BlLnNlbGVjdENvdmVyID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmNvdmVyX3VybCA9IHVybDtcblx0fVxuXHQkc2NvcGUuc2VsZWN0UGFnZUltYWdlID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLnBhZ2VzWyRzY29wZS5wb3MtMl0uaW1hZ2VfdXJsID0gdXJsO1xuXHR9XG5cdCRzY29wZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnN0YXR1cyA9IFwicHVibGlzaGVkXCI7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdGlmICgkc2NvcGUubmV3U3RvcnkuaWQpIHtcblx0XHRcdFN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KTtcblx0XHR9XG5cdFx0JHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcblx0XHRcblx0fVxuXG5cdCRzY29wZS5zYXZlU3RvcnkgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLm5ld1N0b3J5KTtcblx0XHRjb25zb2xlLmxvZygkc2NvcGUucGFnZXMpO1xuXHRcdGlmICgkc2NvcGUubmV3U3RvcnkuaWQpIHtcblx0XHRcdGNvbnNvbGUubG9nKCd1cGRhdGluZyBmcm9tIHNhdmUnKVxuXHRcdFx0U3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5KCRzY29wZS5uZXdTdG9yeSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpO1xuXHRcdH1cblx0XHQkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuXHR9XG5cblx0JHNjb3BlLmRlbGV0ZVBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMuc3BsaWNlKCRzY29wZS5wb3MtMiwgMSk7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncmVldGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2dyZWV0aW5nL2dyZWV0aW5nLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXJzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VycywgdXNlciwgJHJvb3RTY29wZSwgJHN0YXRlKSB7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5jcmVhdGVOZXcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RTY29wZS5zdG9yeSA9IG51bGw7XG4gICAgfVxuXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYnJvd3NlU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2Jyb3dzZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3RvcnkvYnJvd3NlLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdCcm93c2VTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Jyb3dzZVN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3JzKSB7XG5cdCRzY29wZS5hdXRob3JzID0gYXV0aG9ycy5maWx0ZXIoZnVuY3Rpb24oYXV0aG9yKSB7XG4gICAgICAgIHJldHVybiBhdXRob3Iuc3Rvcmllcy5sZW5ndGg7XG4gICAgfSlcbiAgICBcbiAgICAkc2NvcGUuc3RvcmllcyA9IFtdO1xuICAgICRzY29wZS5hdXRob3JzLmZvckVhY2goZnVuY3Rpb24od3JpdGVyKSB7XG4gICAgICAgIHdyaXRlci5zdG9yaWVzLmZvckVhY2goZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvciA9IHdyaXRlci5uYW1lO1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9ySWQgPSB3cml0ZXIuaWQ7XG4gICAgICAgICAgICBpZiAoc3Rvcnkuc3RhdHVzID09PSAncHVibGlzaGVkJykge1xuICAgICAgICAgICAgICAgJHNjb3BlLnN0b3JpZXMucHVzaChzdG9yeSk7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBcbiAgICB2YXIgZ2VucmVzID0gWydTY2llbmNlIEZpY3Rpb24nLCAnUmVhbGlzdGljIEZpY3Rpb24nLCAnTm9uZmljdGlvbicsICdGYW50YXN5JywgJ1JvbWFuY2UnLCAnVHJhdmVsJywgJ0NoaWxkcmVuJywgJ0hvcnJvciddO1xuICAgICRzY29wZS5nZW5yZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbnJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAkc2NvcGUuZ2VucmVzLnB1c2goJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IGdlbnJlc1tpXTtcbiAgICAgICAgfSkpXG4gICAgfVxuICAgIFxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU3RvcnknLCB7XG4gICAgICAgIHVybDogJy9zdG9yeS86c3RvcnlJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3Rvcnkvc2luZ2xlLXN0b3J5Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2luZ2xlU3RvcnlDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHN0b3J5OiBmdW5jdGlvbihTdG9yeUZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuICAgICAgICBcdFx0cmV0dXJuIFN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnN0b3J5SWQpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICBhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoc3RvcnkudXNlcklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaW5nbGVTdG9yeUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgc3RvcnksIGF1dGhvciwgdXNlciwgJHJvb3RTY29wZSkge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xuICAgICRzY29wZS5uZXdTdG9yeSA9IHN0b3J5O1xuICAgICRzY29wZS5wYWdlcyA9IHN0b3J5LnBhZ2VzO1xuICAgICRzY29wZS5kZWxldGFiaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHVzZXIuaWQgPT09IGF1dGhvci5pZCB8fCB1c2VyLmdvb2dsZV9pZCA9PT0gMTA1NjkwNTM3Njc5OTc0Nzg3MDAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBcbiAgICB9XG4gICAgdmFyIHZvaWNlID0gd2luZG93LnNwZWVjaFN5bnRoZXNpcztcbiAgICBcbiAgICAkc2NvcGUuZGVsZXRlU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuICAgICAgICBTdG9yeUZhY3RvcnkuZGVsZXRlKHN0b3J5KTtcbiAgICB9XG4gICAgJHNjb3BlLnJlYWRBbG91ZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICAgICAgICB2b2ljZS5jYW5jZWwoKTtcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UodGV4dCk7XG4gICAgICAgIHZvaWNlLnNwZWFrKG1zZyk7XG4gICAgfVxuXG59KTsiLCJhcHAuZmFjdG9yeSgnU3RvcnlGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciBzdG9yeUZhY3RvcnkgPSB7fTtcblx0dmFyIGJhc2VVcmwgPSBcIi9hcGkvc3Rvcmllcy9cIjtcblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hQdWJsaXNoZWQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdhbGwnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChhbGxTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gYWxsU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24oc3RvcnlJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdzdG9yeS8nICsgc3RvcnlJZClcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdHJldHVybiBzdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hVc2VyU3RvcmllcyA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICd1c2VyLycgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBzdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KGJhc2VVcmwsIHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3J5LmRhdGFcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0JHN0YXRlLmdvKCdzaW5nbGVTdG9yeScsIHtzdG9yeUlkOiBzdG9yeS5pZH0pXG5cdFx0fSlcblx0XHRcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5kZWxldGUgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5kZWxldGUoYmFzZVVybCArIHN0b3J5LmlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChkZWxldGVkU3RvcnkpIHtcblx0XHRcdHJldHVybiBkZWxldGVkU3RvcnkuZGF0YTtcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uKGRlbGV0ZWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHZhciBjdXJyU3RvcnkgPSB0aGlzO1xuXHRcdGN1cnJTdG9yeS5kZWxldGUoc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3VyclN0b3J5LnB1Ymxpc2hTdG9yeShzdG9yeSk7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBzdG9yeUZhY3Rvcnk7XG5cbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgneW91clN0b3JpZXMnLCB7XG4gICAgICAgIHVybDogJy95b3Vyc3RvcmllcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMveW91ci95b3VyLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdZb3VyU3Rvcmllc0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignWW91clN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VyLCAkcm9vdFNjb3BlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlKSB7XG5cdFxuICAgIGlmICgkcm9vdFNjb3BlLnBhZ2VVcGRhdGUpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5wdWJsaXNoZWRTdG9yaWVzID0gJHNjb3BlLnVzZXIuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHN0b3J5LnN0YXR1cyA9PT0gJ3B1Ymxpc2hlZCc7XG4gICAgfSlcbiAgICAkc2NvcGUudW5maW5pc2hlZFN0b3JpZXMgPSAkc2NvcGUudXNlci5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICByZXR1cm4gc3Rvcnkuc3RhdHVzICE9PSAncHVibGlzaGVkJztcbiAgICB9KVxuXG4gICAgJHNjb3BlLnJlc3VtZSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICRyb290U2NvcGUuc3RvcnkgPSBzdG9yeTtcbiAgICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHVzZXJGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3VzZXJzL1wiO1xuXG5cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdHJldHVybiB1c2VyLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuXHRcdFx0cmV0dXJuIHVzZXJzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiB1c2VyRmFjdG9yeTtcbn0pOyIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdicm93c2VTdG9yaWVzJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
