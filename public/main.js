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
    $scope.messages = ["select a genre for your new story", "design the cover of your story book", "design your book's pages"];
    if ($rootScope.story) {
        $scope.newStory = $rootScope.story;
        $scope.pages = $scope.newStory.pages;
        $scope.pos = $scope.pages.length;
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

    storyFactory.fetchUserStories = function (userId) {
        return $http.get(baseUrl + 'user/' + userId).then(function (stories) {
            console.log(stories.data);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJ1c2VyL3VzZXIuZmFjdG9yeS5qcyIsInlvdXIveW91ci5zdG9yaWVzLmpzIiwibG9naW4vbG9naW4uanMiLCJzdG9yeS9icm93c2Uuc3Rvcmllcy5qcyIsInN0b3J5L3NpbmdsZS5zdG9yeS5qcyIsInN0b3J5L3N0b3J5LmZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsIm90aGVyd2lzZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsInJ1biIsIiRyb290U2NvcGUiLCJBdXRoU2VydmljZSIsIiRzdGF0ZSIsImRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgiLCJzdGF0ZSIsImRhdGEiLCJhdXRoZW50aWNhdGUiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImlzQXV0aGVudGljYXRlZCIsInByZXZlbnREZWZhdWx0IiwiZ2V0TG9nZ2VkSW5Vc2VyIiwidGhlbiIsInVzZXIiLCJnbyIsIm5hbWUiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInRlbXBsYXRlVXJsIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwicmVzb2x2ZSIsImF1dGhvciIsIlVzZXJGYWN0b3J5IiwiJHN0YXRlUGFyYW1zIiwiZmV0Y2hCeUlkIiwiYXV0aG9ySWQiLCIkc2NvcGUiLCJTdG9yeUZhY3RvcnkiLCJtZXNzYWdlcyIsInN0b3J5IiwibmV3U3RvcnkiLCJwYWdlcyIsInBvcyIsImxlbmd0aCIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJpbWFnZV91cmwiLCJjb250ZW50IiwiaWQiLCJpbWFnZXMiLCJpIiwicHVzaCIsInRvU3RyaW5nIiwiZ2VucmVzIiwidHlwZSIsImltYWdlIiwic2VsZWN0R2VucmUiLCJjb25zb2xlIiwibG9nIiwic2Nyb2xsIiwiZ29CYWNrIiwibmV4dFBhZ2UiLCJzdWJtaXRUaXRsZSIsInN1Ym1pdFBhZ2UiLCJzZWxlY3RDb3ZlciIsInNlbGVjdFBhZ2VJbWFnZSIsInB1Ymxpc2giLCJ1cGRhdGVTdG9yeSIsInB1Ymxpc2hTdG9yeSIsInBhZ2VVcGRhdGUiLCJzYXZlU3RvcnkiLCJkZWxldGVQYWdlIiwic3BsaWNlIiwiRXJyb3IiLCJmYWN0b3J5IiwiaW8iLCJvcmlnaW4iLCJjb25zdGFudCIsImxvZ2luU3VjY2VzcyIsImxvZ2luRmFpbGVkIiwibG9nb3V0U3VjY2VzcyIsInNlc3Npb25UaW1lb3V0Iiwibm90QXV0aGVudGljYXRlZCIsIm5vdEF1dGhvcml6ZWQiLCIkcSIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCJyZXNwb25zZSIsIiRicm9hZGNhc3QiLCJyZWplY3QiLCIkaHR0cFByb3ZpZGVyIiwiaW50ZXJjZXB0b3JzIiwiJGluamVjdG9yIiwiZ2V0Iiwic2VydmljZSIsIiRodHRwIiwiU2Vzc2lvbiIsIm9uU3VjY2Vzc2Z1bExvZ2luIiwiY3JlYXRlIiwiZnJvbVNlcnZlciIsImNhdGNoIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJ1c2VycyIsImZldGNoQWxsIiwiY3JlYXRlTmV3IiwidXNlckZhY3RvcnkiLCJiYXNlVXJsIiwicHVibGlzaGVkU3RvcmllcyIsInN0b3JpZXMiLCJmaWx0ZXIiLCJ1bmZpbmlzaGVkU3RvcmllcyIsInJlc3VtZSIsImVycm9yIiwic2VuZExvZ2luIiwibG9naW5JbmZvIiwiYXV0aG9ycyIsImZvckVhY2giLCJ3cml0ZXIiLCJzdG9yeUlkIiwidm9pY2UiLCJzcGVlY2hTeW50aGVzaXMiLCJyZWFkQWxvdWQiLCJ0ZXh0IiwiY2FuY2VsIiwibXNnIiwiU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIiwic3BlYWsiLCJzdG9yeUZhY3RvcnkiLCJmZXRjaFB1Ymxpc2hlZCIsImFsbFN0b3JpZXMiLCJmZXRjaFVzZXJTdG9yaWVzIiwicHVibGlzaGVkU3RvcnkiLCJwdXQiLCJ1cGRhdGVkU3RvcnkiLCJyZWFkIiwic29uZyIsInNvbmdUb1BsYXkiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNBRix1QkFBQUcsU0FBQSxDQUFBLEdBQUE7QUFDQTtBQUNBSCx1QkFB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QUFDQSxhQUZBOztBQUlBMEksa0JBQUE5QyxNQUFBLEdBQUEsWUFBQTtBQUNBdEcsNEJBQUFzRyxNQUFBLEdBQUF6RixJQUFBLENBQUEsWUFBQTtBQUNBWiwyQkFBQWMsRUFBQSxDQUFBLGVBQUE7QUFDQSxpQkFGQTtBQUdBLGFBSkE7O0FBTUEsZ0JBQUF3SSxVQUFBLFNBQUFBLE9BQUEsR0FBQTtBQUNBdkosNEJBQUFZLGVBQUEsR0FBQUMsSUFBQSxDQUFBLFVBQUFDLElBQUEsRUFBQTtBQUNBc0ksMEJBQUF0SSxJQUFBLEdBQUFBLElBQUE7QUFDQSxpQkFGQTtBQUdBLGFBSkE7O0FBTUEsZ0JBQUEwSSxhQUFBLFNBQUFBLFVBQUEsR0FBQTtBQUNBSixzQkFBQXRJLElBQUEsR0FBQSxJQUFBO0FBQ0EsYUFGQTs7QUFJQXlJOztBQUVBeEosdUJBQUFPLEdBQUEsQ0FBQTJFLFlBQUFQLFlBQUEsRUFBQTZFLE9BQUE7QUFDQXhKLHVCQUFBTyxHQUFBLENBQUEyRSxZQUFBTCxhQUFBLEVBQUE0RSxVQUFBO0FBQ0F6Six1QkFBQU8sR0FBQSxDQUFBMkUsWUFBQUosY0FBQSxFQUFBMkUsVUFBQTtBQUVBOztBQWxDQSxLQUFBO0FBc0NBLENBeENBOztBQ0FBckssSUFBQThCLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQUMsa0JBQUEsR0FEQTtBQUVBQyxxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBO0FDQUFoQyxJQUFBOEIsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBd0ksZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQXZJLGtCQUFBLEdBREE7QUFFQUMscUJBQUEseURBRkE7QUFHQWtJLGNBQUEsY0FBQUQsS0FBQSxFQUFBO0FBQ0FBLGtCQUFBTSxRQUFBLEdBQUFELGdCQUFBTixpQkFBQSxFQUFBO0FBQ0E7QUFMQSxLQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ3NsaWNrJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdhY2NvdW50JywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWNjb3VudC9hY2NvdW50Lmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGhvcicsIHtcbiAgICAgICAgdXJsOiAnL2F1dGhvci86YXV0aG9ySWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2F1dGhvci9hdXRob3IuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBdXRob3JDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGF1dGhvcjogZnVuY3Rpb24oVXNlckZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuYXV0aG9ySWQpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBdXRob3JDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3IpIHtcblx0JHNjb3BlLmF1dGhvciA9IGF1dGhvcjtcbn0pIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY3JlYXRlJywge1xuICAgICAgICB1cmw6ICcvY3JlYXRlJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jcmVhdGUvY3JlYXRlLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQ3JlYXRlQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICBcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDcmVhdGVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBTdG9yeUZhY3RvcnksICRzdGF0ZSwgdXNlciwgJHJvb3RTY29wZSkge1xuXHQkc2NvcGUubWVzc2FnZXMgPSBbXCJzZWxlY3QgYSBnZW5yZSBmb3IgeW91ciBuZXcgc3RvcnlcIiwgXCJkZXNpZ24gdGhlIGNvdmVyIG9mIHlvdXIgc3RvcnkgYm9va1wiLCBcImRlc2lnbiB5b3VyIGJvb2sncyBwYWdlc1wiXVxuXHRpZiAoJHJvb3RTY29wZS5zdG9yeSkge1xuXHRcdCRzY29wZS5uZXdTdG9yeSA9ICRyb290U2NvcGUuc3Rvcnk7XG5cdFx0JHNjb3BlLnBhZ2VzID0gJHNjb3BlLm5ld1N0b3J5LnBhZ2VzO1xuXHRcdCRzY29wZS5wb3MgPSAkc2NvcGUucGFnZXMubGVuZ3RoO1xuXHR9IGVsc2Uge1xuXHRcdCRzY29wZS5uZXdTdG9yeSA9IHtcblx0XHRcdHRpdGxlOiBcIk15IE5ldyBTdG9yeVwiLFxuXHRcdFx0c3RhdHVzOiBcImluY29tcGxldGVcIixcblx0XHRcdGNvdmVyX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0Z2VucmU6IFwibm9uZVwiLFxuXHRcdFx0dXNlcklkOiAxLFxuXHRcdFx0cGFnZXM6IG51bGxcblx0XHR9XG5cdFx0JHNjb3BlLnBhZ2VzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHRpbWFnZV91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRcdFx0Y29udGVudDogXCJcIlxuXHRcdFx0fVxuXHRcdF07XG5cdFx0JHNjb3BlLnBvcyA9IDA7XG5cdH1cblx0XG5cdCRzY29wZS5hdXRob3IgPSBcImFub255bW91c1wiXG5cdGlmICh1c2VyKSB7XG5cdFx0JHNjb3BlLmF1dGhvciA9IHVzZXIubmFtZTtcblx0XHQkc2NvcGUubmV3U3RvcnkudXNlcklkID0gdXNlci5pZDsgXG5cdH1cblx0XG5cdCRzY29wZS5pbWFnZXMgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCAyNjc7IGkrKykge1xuXG5cdFx0JHNjb3BlLmltYWdlcy5wdXNoKGkudG9TdHJpbmcoKSArICcucG5nJyk7XG5cdH1cblx0XG5cblx0XG5cblx0JHNjb3BlLmdlbnJlcyA9IFtcblx0XHR7XG5cdFx0XHR0eXBlOiAnU2NpZW5jZSBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAnc2NpZW5jZS1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUmVhbGlzdGljIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdyZWFsaXN0aWMtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ05vbmZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdub25maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnRmFudGFzeScsXG5cdFx0XHRpbWFnZTogJ2ZhbnRhc3kuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSb21hbmNlJyxcblx0XHRcdGltYWdlOiAncm9tYW5jZS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1RyYXZlbCcsXG5cdFx0XHRpbWFnZTogJ3RyYXZlbC5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0NoaWxkcmVuJyxcblx0XHRcdGltYWdlOiAnY2hpbGRyZW4uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdIb3Jyb3InLFxuXHRcdFx0aW1hZ2U6ICdhZHVsdC5qcGcnLFxuXHRcdH1cblx0XTtcblxuXHQkc2NvcGUuc2VsZWN0R2VucmUgPSBmdW5jdGlvbihnZW5yZSkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5nZW5yZSA9IGdlbnJlO1xuXHRcdGNvbnNvbGUubG9nKCRzY29wZS5uZXdTdG9yeS5nZW5yZSk7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuZ29CYWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxuXHQkc2NvcGUubmV4dFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHR9XG5cblx0JHNjb3BlLnN1Ym1pdFRpdGxlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblx0JHNjb3BlLnN1Ym1pdFBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMucHVzaCh7aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsIGNvbnRlbnQ6ICcnfSk7XG5cdFx0JHNjb3BlLnBvcyA9ICRzY29wZS5wYWdlcy5sZW5ndGggKyAxO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuY292ZXJfdXJsID0gdXJsO1xuXHR9XG5cdCRzY29wZS5zZWxlY3RQYWdlSW1hZ2UgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUucGFnZXNbJHNjb3BlLnBvcy0yXS5pbWFnZV91cmwgPSB1cmw7XG5cdH1cblx0JHNjb3BlLnB1Ymxpc2ggPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUubmV3U3Rvcnkuc3RhdHVzID0gXCJwdWJsaXNoZWRcIjtcblx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0aWYgKCRzY29wZS5uZXdTdG9yeS5pZCkge1xuXHRcdFx0U3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5KCRzY29wZS5uZXdTdG9yeSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpO1xuXHRcdH1cblx0XHQkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuXHRcdFxuXHR9XG5cblx0JHNjb3BlLnNhdmVTdG9yeSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5uZXdTdG9yeS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblx0XHRpZiAoJHNjb3BlLm5ld1N0b3J5LmlkKSB7XG5cdFx0XHRTdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkoJHNjb3BlLm5ld1N0b3J5KVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRTdG9yeUZhY3RvcnkucHVibGlzaFN0b3J5KCRzY29wZS5uZXdTdG9yeSk7XG5cdFx0fVxuXHRcdCRyb290U2NvcGUucGFnZVVwZGF0ZSA9IHRydWU7XG5cdH1cblxuXHQkc2NvcGUuZGVsZXRlUGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wYWdlcy5zcGxpY2UoJHNjb3BlLnBvcy0yLCAxKTtcblx0XHQkc2NvcGUucG9zIC0tO1xuXHR9XG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5kaXJlY3RpdmUoJ2dyZWV0aW5nJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZ3JlZXRpbmcvZ3JlZXRpbmcuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcnM6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgICAgXHR9LFxuICAgICAgICAgICAgdXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignSG9tZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHVzZXJzLCB1c2VyLCAkcm9vdFNjb3BlLCAkc3RhdGUpIHtcbiAgICAkc2NvcGUudXNlciA9IHVzZXI7XG4gICAgJHNjb3BlLmNyZWF0ZU5ldyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkcm9vdFNjb3BlLnN0b3J5ID0gbnVsbDtcbiAgICB9XG5cbn0pIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciB1c2VyRmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS91c2Vycy9cIjtcblxuXG5cblx0dXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gdXNlci5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcblx0XHRcdHJldHVybiB1c2Vycy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gdXNlckZhY3Rvcnk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd5b3VyU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL3lvdXJzdG9yaWVzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy95b3VyL3lvdXItc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1lvdXJTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICBcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdZb3VyU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHVzZXIsICRyb290U2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UpIHtcblx0XG4gICAgaWYgKCRyb290U2NvcGUucGFnZVVwZGF0ZSkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICRyb290U2NvcGUucGFnZVVwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAkc2NvcGUudXNlciA9IHVzZXI7XG4gICAgJHNjb3BlLnB1Ymxpc2hlZFN0b3JpZXMgPSAkc2NvcGUudXNlci5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICByZXR1cm4gc3Rvcnkuc3RhdHVzID09PSAncHVibGlzaGVkJztcbiAgICB9KVxuICAgICRzY29wZS51bmZpbmlzaGVkU3RvcmllcyA9ICRzY29wZS51c2VyLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIHJldHVybiBzdG9yeS5zdGF0dXMgIT09ICdwdWJsaXNoZWQnO1xuICAgIH0pXG5cbiAgICAkc2NvcGUucmVzdW1lID0gZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgJHJvb3RTY29wZS5zdG9yeSA9IHN0b3J5O1xuICAgIH1cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYnJvd3NlU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2Jyb3dzZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3RvcnkvYnJvd3NlLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdCcm93c2VTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Jyb3dzZVN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3JzKSB7XG5cdCRzY29wZS5hdXRob3JzID0gYXV0aG9ycy5maWx0ZXIoZnVuY3Rpb24oYXV0aG9yKSB7XG4gICAgICAgIHJldHVybiBhdXRob3Iuc3Rvcmllcy5sZW5ndGg7XG4gICAgfSlcbiAgICBcbiAgICAkc2NvcGUuc3RvcmllcyA9IFtdO1xuICAgICRzY29wZS5hdXRob3JzLmZvckVhY2goZnVuY3Rpb24od3JpdGVyKSB7XG4gICAgICAgIHdyaXRlci5zdG9yaWVzLmZvckVhY2goZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvciA9IHdyaXRlci5uYW1lO1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9ySWQgPSB3cml0ZXIuaWQ7XG4gICAgICAgICAgICBpZiAoc3Rvcnkuc3RhdHVzID09PSAncHVibGlzaGVkJykge1xuICAgICAgICAgICAgICAgJHNjb3BlLnN0b3JpZXMucHVzaChzdG9yeSk7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBcbiAgICB2YXIgZ2VucmVzID0gWydTY2llbmNlIEZpY3Rpb24nLCAnUmVhbGlzdGljIEZpY3Rpb24nLCAnTm9uZmljdGlvbicsICdGYW50YXN5JywgJ1JvbWFuY2UnLCAnVHJhdmVsJywgJ0NoaWxkcmVuJywgJ0hvcnJvciddO1xuICAgICRzY29wZS5nZW5yZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbnJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAkc2NvcGUuZ2VucmVzLnB1c2goJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IGdlbnJlc1tpXTtcbiAgICAgICAgfSkpXG4gICAgfVxuICAgIFxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU3RvcnknLCB7XG4gICAgICAgIHVybDogJy9zdG9yeS86c3RvcnlJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3Rvcnkvc2luZ2xlLXN0b3J5Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2luZ2xlU3RvcnlDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHN0b3J5OiBmdW5jdGlvbihTdG9yeUZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuICAgICAgICBcdFx0cmV0dXJuIFN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnN0b3J5SWQpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICBhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoc3RvcnkudXNlcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaW5nbGVTdG9yeUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgc3RvcnksIGF1dGhvcikge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xuICAgICRzY29wZS5uZXdTdG9yeSA9IHN0b3J5O1xuICAgICRzY29wZS5wYWdlcyA9IHN0b3J5LnBhZ2VzO1xuICAgIGNvbnNvbGUubG9nKCdoZXJlIGlzIHRoZSBzaW5nbGUgc3Rvcnk6ICcsIHN0b3J5KTtcbiAgICB2YXIgdm9pY2UgPSB3aW5kb3cuc3BlZWNoU3ludGhlc2lzO1xuICAgIFxuICAgICRzY29wZS5yZWFkQWxvdWQgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgICAgICAgdm9pY2UuY2FuY2VsKCk7XG4gICAgICAgIHZhciBtc2cgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlKHRleHQpO1xuICAgICAgICB2b2ljZS5zcGVhayhtc2cpO1xuICAgIH1cbn0pOyIsImFwcC5mYWN0b3J5KCdTdG9yeUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHN0b3J5RmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS9zdG9yaWVzL1wiO1xuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaFB1Ymxpc2hlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ2FsbCcpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKGFsbFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBhbGxTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbihzdG9yeUlkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ3N0b3J5LycgKyBzdG9yeUlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0Y29uc29sZS5sb2coc3RvcnkuZGF0YSk7XG5cdFx0XHRyZXR1cm4gc3RvcnkuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoVXNlclN0b3JpZXMgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAndXNlci8nICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yaWVzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzdG9yaWVzLmRhdGEpO1xuXHRcdFx0cmV0dXJuIHN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoYmFzZVVybCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3J5KSB7XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3RvcnkuZGF0YVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZVN0b3J5Jywge3N0b3J5SWQ6IHN0b3J5LmlkfSlcblx0XHR9KVxuXHRcdFxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucHV0KGJhc2VVcmwgKyBzdG9yeS5pZCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVwZGF0ZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHVwZGF0ZWRTdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucmVhZCA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCdodHRwOi8vYXBpLnZvaWNlcnNzLm9yZy8/a2V5PTJlNzE0NTE4ZTZiYTQ2ZGQ5YzQ4NzI5MDBlODgyNTVjJmhsPWVuLXVzJnNyYz0nICsgdGV4dClcblx0XHQudGhlbiAoZnVuY3Rpb24gKHNvbmcpIHtcblx0XHRcdHJldHVybiBzb25nLmRhdGE7XG5cdFx0fSlcblx0XHQudGhlbiggZnVuY3Rpb24oc29uZ1RvUGxheSkge1xuXHRcdFx0Y29uc29sZS5sb2coc29uZ1RvUGxheSlcblx0XHRcdFxuXHRcdH0pXG5cdH1cblxuXG5cblx0cmV0dXJuIHN0b3J5RmFjdG9yeTtcblxufSkiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYnJvd3NlU3RvcmllcycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
