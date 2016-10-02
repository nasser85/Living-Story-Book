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
        if ($scope.newStory.id) {
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
        if (user.id === author.id || user.google_id === "105690537679974787001") {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsInN0b3J5L2Jyb3dzZS5zdG9yaWVzLmpzIiwic3Rvcnkvc2luZ2xlLnN0b3J5LmpzIiwic3Rvcnkvc3RvcnkuZmFjdG9yeS5qcyIsInVzZXIvdXNlci5mYWN0b3J5LmpzIiwieW91ci95b3VyLnN0b3JpZXMuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsIm90aGVyd2lzZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsInJ1biIsIiRyb290U2NvcGUiLCJBdXRoU2VydmljZSIsIiRzdGF0ZSIsImRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgiLCJzdGF0ZSIsImRhdGEiLCJhdXRoZW50aWNhdGUiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImlzQXV0aGVudGljYXRlZCIsInByZXZlbnREZWZhdWx0IiwiZ2V0TG9nZ2VkSW5Vc2VyIiwidGhlbiIsInVzZXIiLCJnbyIsIm5hbWUiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInRlbXBsYXRlVXJsIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwicmVzb2x2ZSIsImF1dGhvciIsIlVzZXJGYWN0b3J5IiwiJHN0YXRlUGFyYW1zIiwiZmV0Y2hCeUlkIiwiYXV0aG9ySWQiLCIkc2NvcGUiLCJTdG9yeUZhY3RvcnkiLCJtZXNzYWdlcyIsInN0b3J5IiwibmV3U3RvcnkiLCJwYWdlcyIsInBvcyIsImxlbmd0aCIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJpbWFnZV91cmwiLCJjb250ZW50IiwiaWQiLCJpbWFnZXMiLCJpIiwicHVzaCIsInRvU3RyaW5nIiwiZ2VucmVzIiwidHlwZSIsImltYWdlIiwic2VsZWN0R2VucmUiLCJjb25zb2xlIiwibG9nIiwic2Nyb2xsIiwiZ29CYWNrIiwibmV4dFBhZ2UiLCJzdWJtaXRUaXRsZSIsInN1Ym1pdFBhZ2UiLCJzZWxlY3RDb3ZlciIsInNlbGVjdFBhZ2VJbWFnZSIsInB1Ymxpc2giLCJ1cGRhdGVTdG9yeSIsInB1Ymxpc2hTdG9yeSIsInBhZ2VVcGRhdGUiLCJzYXZlU3RvcnkiLCJkZWxldGVQYWdlIiwic3BsaWNlIiwiRXJyb3IiLCJmYWN0b3J5IiwiaW8iLCJvcmlnaW4iLCJjb25zdGFudCIsImxvZ2luU3VjY2VzcyIsImxvZ2luRmFpbGVkIiwibG9nb3V0U3VjY2VzcyIsInNlc3Npb25UaW1lb3V0Iiwibm90QXV0aGVudGljYXRlZCIsIm5vdEF1dGhvcml6ZWQiLCIkcSIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCJyZXNwb25zZSIsIiRicm9hZGNhc3QiLCJyZWplY3QiLCIkaHR0cFByb3ZpZGVyIiwiaW50ZXJjZXB0b3JzIiwiJGluamVjdG9yIiwiZ2V0Iiwic2VydmljZSIsIiRodHRwIiwiU2Vzc2lvbiIsIm9uU3VjY2Vzc2Z1bExvZ2luIiwiY3JlYXRlIiwiZnJvbVNlcnZlciIsImNhdGNoIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJ1c2VycyIsImZldGNoQWxsIiwiY3JlYXRlTmV3IiwiZXJyb3IiLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJhdXRob3JzIiwiZmlsdGVyIiwic3RvcmllcyIsImZvckVhY2giLCJ3cml0ZXIiLCJzdG9yeUlkIiwiZGVsZXRhYmlsaXR5IiwiZ29vZ2xlX2lkIiwidm9pY2UiLCJzcGVlY2hTeW50aGVzaXMiLCJkZWxldGVTdG9yeSIsImRlbGV0ZSIsInJlYWRBbG91ZCIsInRleHQiLCJjYW5jZWwiLCJtc2ciLCJTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UiLCJzcGVhayIsInN0b3J5RmFjdG9yeSIsImJhc2VVcmwiLCJmZXRjaFB1Ymxpc2hlZCIsInB1Ymxpc2hlZFN0b3JpZXMiLCJhbGxTdG9yaWVzIiwiZmV0Y2hVc2VyU3RvcmllcyIsInB1Ymxpc2hlZFN0b3J5IiwiZGVsZXRlZFN0b3J5IiwiZGVsZXRlZCIsImN1cnJTdG9yeSIsInVzZXJGYWN0b3J5IiwidW5maW5pc2hlZFN0b3JpZXMiLCJyZXN1bWUiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNB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RUFBQTZFLFVBQUE7QUFFQTs7QUFsQ0EsS0FBQTtBQXNDQSxDQXhDQTs7QUNBQXZLLElBQUE4QixTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEwSSxlQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBekksa0JBQUEsR0FEQTtBQUVBQyxxQkFBQSx5REFGQTtBQUdBb0ksY0FBQSxjQUFBRCxLQUFBLEVBQUE7QUFDQUEsa0JBQUFNLFFBQUEsR0FBQUQsZ0JBQUFOLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnc2xpY2snXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2FjY291bnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hY2NvdW50L2FjY291bnQuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aG9yJywge1xuICAgICAgICB1cmw6ICcvYXV0aG9yLzphdXRob3JJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYXV0aG9yL2F1dGhvci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0F1dGhvckN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YXV0aG9yOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5hdXRob3JJZCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0F1dGhvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvcikge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjcmVhdGUnLCB7XG4gICAgICAgIHVybDogJy9jcmVhdGUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NyZWF0ZS9jcmVhdGUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDcmVhdGVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NyZWF0ZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgJHN0YXRlLCB1c2VyLCAkcm9vdFNjb3BlKSB7XG5cdCRzY29wZS51c2VyID0gdXNlcjtcblx0JHNjb3BlLm1lc3NhZ2VzID0gW1wic2VsZWN0IGEgZ2VucmUgZm9yIHlvdXIgbmV3IHN0b3J5XCIsIFwiZGVzaWduIHRoZSBjb3ZlciBvZiB5b3VyIHN0b3J5IGJvb2tcIiwgXCJkZXNpZ24geW91ciBib29rJ3MgcGFnZXNcIl1cblx0aWYgKCRyb290U2NvcGUuc3RvcnkpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkgPSAkcm9vdFNjb3BlLnN0b3J5O1xuXHRcdCRzY29wZS5wYWdlcyA9ICRzY29wZS5uZXdTdG9yeS5wYWdlcztcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdH0gZWxzZSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5ID0ge1xuXHRcdFx0dGl0bGU6IFwiTXkgTmV3IFN0b3J5XCIsXG5cdFx0XHRzdGF0dXM6IFwiaW5jb21wbGV0ZVwiLFxuXHRcdFx0Y292ZXJfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRnZW5yZTogXCJub25lXCIsXG5cdFx0XHR1c2VySWQ6IDEsXG5cdFx0XHRwYWdlczogbnVsbFxuXHRcdH1cblx0XHQkc2NvcGUucGFnZXMgPSBbXG5cdFx0XHR7XG5cdFx0XHRcdGltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0XHRjb250ZW50OiBcIlwiXG5cdFx0XHR9XG5cdFx0XTtcblx0XHQkc2NvcGUucG9zID0gMDtcblx0fVxuXHRcblx0JHNjb3BlLmF1dGhvciA9IFwiYW5vbnltb3VzXCJcblx0aWYgKHVzZXIpIHtcblx0XHQkc2NvcGUuYXV0aG9yID0gdXNlci5uYW1lO1xuXHRcdCRzY29wZS5uZXdTdG9yeS51c2VySWQgPSB1c2VyLmlkOyBcblx0fVxuXHRcblx0JHNjb3BlLmltYWdlcyA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IDI2NzsgaSsrKSB7XG5cblx0XHQkc2NvcGUuaW1hZ2VzLnB1c2goaS50b1N0cmluZygpICsgJy5wbmcnKTtcblx0fVxuXHRcblxuXHRcblxuXHQkc2NvcGUuZ2VucmVzID0gW1xuXHRcdHtcblx0XHRcdHR5cGU6ICdTY2llbmNlIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdzY2llbmNlLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSZWFsaXN0aWMgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3JlYWxpc3RpYy1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnTm9uZmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ25vbmZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdGYW50YXN5Jyxcblx0XHRcdGltYWdlOiAnZmFudGFzeS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JvbWFuY2UnLFxuXHRcdFx0aW1hZ2U6ICdyb21hbmNlLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnVHJhdmVsJyxcblx0XHRcdGltYWdlOiAndHJhdmVsLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnQ2hpbGRyZW4nLFxuXHRcdFx0aW1hZ2U6ICdjaGlsZHJlbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0hvcnJvcicsXG5cdFx0XHRpbWFnZTogJ2FkdWx0LmpwZycsXG5cdFx0fVxuXHRdO1xuXG5cdCRzY29wZS5zZWxlY3RHZW5yZSA9IGZ1bmN0aW9uKGdlbnJlKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmdlbnJlID0gZ2VucmU7XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLm5ld1N0b3J5LmdlbnJlKTtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5nb0JhY2sgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zIC0tO1xuXHR9XG5cdCRzY29wZS5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0VGl0bGUgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXHQkc2NvcGUuc3VibWl0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wYWdlcy5wdXNoKHtpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIiwgY29udGVudDogJyd9KTtcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cdCRzY29wZS5zZWxlY3RDb3ZlciA9IGZ1bmN0aW9uKHVybCkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5jb3Zlcl91cmwgPSB1cmw7XG5cdH1cblx0JHNjb3BlLnNlbGVjdFBhZ2VJbWFnZSA9IGZ1bmN0aW9uKHVybCkge1xuXHRcdCRzY29wZS5wYWdlc1skc2NvcGUucG9zLTJdLmltYWdlX3VybCA9IHVybDtcblx0fVxuXHQkc2NvcGUucHVibGlzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5zdGF0dXMgPSBcInB1Ymxpc2hlZFwiO1xuXHRcdCRzY29wZS5uZXdTdG9yeS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblx0XHRpZiAoJHNjb3BlLm5ld1N0b3J5LmlkKSB7XG5cdFx0XHRTdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkoJHNjb3BlLm5ld1N0b3J5KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KCRzY29wZS5uZXdTdG9yeSk7XG5cdFx0fVxuXHRcdCRyb290U2NvcGUucGFnZVVwZGF0ZSA9IHRydWU7XG5cdFx0XG5cdH1cblxuXHQkc2NvcGUuc2F2ZVN0b3J5ID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdGlmICgkc2NvcGUubmV3U3RvcnkuaWQpIHtcblx0XHRcdFN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KTtcblx0XHR9XG5cdFx0JHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcblx0fVxuXG5cdCRzY29wZS5kZWxldGVQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnNwbGljZSgkc2NvcGUucG9zLTIsIDEpO1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JlZXRpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ncmVldGluZy9ncmVldGluZy5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdIb21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgdXNlcnMsIHVzZXIsICRyb290U2NvcGUsICRzdGF0ZSkge1xuICAgICRzY29wZS51c2VyID0gdXNlcjtcbiAgICAkc2NvcGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290U2NvcGUuc3RvcnkgPSBudWxsO1xuICAgIH1cblxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Jyb3dzZVN0b3JpZXMnLCB7XG4gICAgICAgIHVybDogJy9icm93c2UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3N0b3J5L2Jyb3dzZS1zdG9yaWVzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQnJvd3NlU3Rvcmllc0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YXV0aG9yczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdCcm93c2VTdG9yaWVzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgYXV0aG9ycykge1xuXHQkc2NvcGUuYXV0aG9ycyA9IGF1dGhvcnMuZmlsdGVyKGZ1bmN0aW9uKGF1dGhvcikge1xuICAgICAgICByZXR1cm4gYXV0aG9yLnN0b3JpZXMubGVuZ3RoO1xuICAgIH0pXG4gICAgXG4gICAgJHNjb3BlLnN0b3JpZXMgPSBbXTtcbiAgICAkc2NvcGUuYXV0aG9ycy5mb3JFYWNoKGZ1bmN0aW9uKHdyaXRlcikge1xuICAgICAgICB3cml0ZXIuc3Rvcmllcy5mb3JFYWNoKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICBzdG9yeS5hdXRob3IgPSB3cml0ZXIubmFtZTtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvcklkID0gd3JpdGVyLmlkO1xuICAgICAgICAgICAgaWYgKHN0b3J5LnN0YXR1cyA9PT0gJ3B1Ymxpc2hlZCcpIHtcbiAgICAgICAgICAgICAgICRzY29wZS5zdG9yaWVzLnB1c2goc3RvcnkpOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICB9KVxuICAgIH0pXG4gICAgXG4gICAgdmFyIGdlbnJlcyA9IFsnU2NpZW5jZSBGaWN0aW9uJywgJ1JlYWxpc3RpYyBGaWN0aW9uJywgJ05vbmZpY3Rpb24nLCAnRmFudGFzeScsICdSb21hbmNlJywgJ1RyYXZlbCcsICdDaGlsZHJlbicsICdIb3Jyb3InXTtcbiAgICAkc2NvcGUuZ2VucmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW5yZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgJHNjb3BlLmdlbnJlcy5wdXNoKCRzY29wZS5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAgICAgcmV0dXJuIHN0b3J5LmdlbnJlID09PSBnZW5yZXNbaV07XG4gICAgICAgIH0pKVxuICAgIH1cbiAgICBcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZVN0b3J5Jywge1xuICAgICAgICB1cmw6ICcvc3RvcnkvOnN0b3J5SWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3N0b3J5L3NpbmdsZS1zdG9yeS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpbmdsZVN0b3J5Q3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRzdG9yeTogZnVuY3Rpb24oU3RvcnlGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgXHRcdHJldHVybiBTdG9yeUZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5zdG9yeUlkKTtcbiAgICAgICAgXHR9LFxuICAgICAgICAgICAgYXV0aG9yOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKHN0b3J5LnVzZXJJZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2luZ2xlU3RvcnlDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBTdG9yeUZhY3RvcnksIHN0b3J5LCBhdXRob3IsIHVzZXIsICRyb290U2NvcGUpIHtcblx0JHNjb3BlLmF1dGhvciA9IGF1dGhvcjtcbiAgICAkc2NvcGUubmV3U3RvcnkgPSBzdG9yeTtcbiAgICAkc2NvcGUucGFnZXMgPSBzdG9yeS5wYWdlcztcbiAgICAkc2NvcGUuZGVsZXRhYmlsaXR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh1c2VyLmlkID09PSBhdXRob3IuaWQgfHwgdXNlci5nb29nbGVfaWQgPT09IFwiMTA1NjkwNTM3Njc5OTc0Nzg3MDAxXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IFxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIFxuICAgIH1cbiAgICB2YXIgdm9pY2UgPSB3aW5kb3cuc3BlZWNoU3ludGhlc2lzO1xuICAgIFxuICAgICRzY29wZS5kZWxldGVTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICRyb290U2NvcGUucGFnZVVwZGF0ZSA9IHRydWU7XG4gICAgICAgIFN0b3J5RmFjdG9yeS5kZWxldGUoc3RvcnkpO1xuICAgIH1cbiAgICAkc2NvcGUucmVhZEFsb3VkID0gZnVuY3Rpb24odGV4dCkge1xuXG4gICAgICAgIHZvaWNlLmNhbmNlbCgpO1xuICAgICAgICB2YXIgbXNnID0gbmV3IFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSh0ZXh0KTtcbiAgICAgICAgdm9pY2Uuc3BlYWsobXNnKTtcbiAgICB9XG5cbn0pOyIsImFwcC5mYWN0b3J5KCdTdG9yeUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHN0b3J5RmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS9zdG9yaWVzL1wiO1xuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaFB1Ymxpc2hlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ2FsbCcpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKGFsbFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBhbGxTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbihzdG9yeUlkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ3N0b3J5LycgKyBzdG9yeUlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0cmV0dXJuIHN0b3J5LmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaFVzZXJTdG9yaWVzID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ3VzZXIvJyArIHVzZXJJZClcblx0XHQudGhlbihmdW5jdGlvbiAoc3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIHN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoYmFzZVVybCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3J5KSB7XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3RvcnkuZGF0YVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZVN0b3J5Jywge3N0b3J5SWQ6IHN0b3J5LmlkfSlcblx0XHR9KVxuXHRcdFxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmRlbGV0ZSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG5cdFx0cmV0dXJuICRodHRwLmRlbGV0ZShiYXNlVXJsICsgc3RvcnkuaWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKGRlbGV0ZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIGRlbGV0ZWRTdG9yeS5kYXRhO1xuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24oZGVsZXRlZCkge1xuXHRcdFx0JHN0YXRlLmdvKCdob21lJyk7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG5cdFx0dmFyIGN1cnJTdG9yeSA9IHRoaXM7XG5cdFx0Y3VyclN0b3J5LmRlbGV0ZShzdG9yeSlcblx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBjdXJyU3RvcnkucHVibGlzaFN0b3J5KHN0b3J5KTtcblx0XHR9KVxuXHR9XG5cblx0cmV0dXJuIHN0b3J5RmFjdG9yeTtcblxufSkiLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHVzZXJGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3VzZXJzL1wiO1xuXG5cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdHJldHVybiB1c2VyLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuXHRcdFx0cmV0dXJuIHVzZXJzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiB1c2VyRmFjdG9yeTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3lvdXJTdG9yaWVzJywge1xuICAgICAgICB1cmw6ICcveW91cnN0b3JpZXMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3lvdXIveW91ci1zdG9yaWVzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnWW91clN0b3JpZXNDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1lvdXJTdG9yaWVzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgdXNlciwgJHJvb3RTY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSkge1xuXHRcbiAgICBpZiAoJHJvb3RTY29wZS5wYWdlVXBkYXRlKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgJHJvb3RTY29wZS5wYWdlVXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgICRzY29wZS51c2VyID0gdXNlcjtcbiAgICAkc2NvcGUucHVibGlzaGVkU3RvcmllcyA9ICRzY29wZS51c2VyLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIHJldHVybiBzdG9yeS5zdGF0dXMgPT09ICdwdWJsaXNoZWQnO1xuICAgIH0pXG4gICAgJHNjb3BlLnVuZmluaXNoZWRTdG9yaWVzID0gJHNjb3BlLnVzZXIuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHN0b3J5LnN0YXR1cyAhPT0gJ3B1Ymxpc2hlZCc7XG4gICAgfSlcblxuICAgICRzY29wZS5yZXN1bWUgPSBmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAkcm9vdFNjb3BlLnN0b3J5ID0gc3Rvcnk7XG4gICAgfVxufSk7IiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdicm93c2VTdG9yaWVzJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
