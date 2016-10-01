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
    for (var i = 0; i < 136; i++) {

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsInN0b3J5L2Jyb3dzZS5zdG9yaWVzLmpzIiwic3Rvcnkvc2luZ2xlLnN0b3J5LmpzIiwic3Rvcnkvc3RvcnkuZmFjdG9yeS5qcyIsInVzZXIvdXNlci5mYWN0b3J5LmpzIiwieW91ci95b3VyLnN0b3JpZXMuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1JhbmRvbUdyZWV0aW5ncy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsIm90aGVyd2lzZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsInJ1biIsIiRyb290U2NvcGUiLCJBdXRoU2VydmljZSIsIiRzdGF0ZSIsImRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgiLCJzdGF0ZSIsImRhdGEiLCJhdXRoZW50aWNhdGUiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImlzQXV0aGVudGljYXRlZCIsInByZXZlbnREZWZhdWx0IiwiZ2V0TG9nZ2VkSW5Vc2VyIiwidGhlbiIsInVzZXIiLCJnbyIsIm5hbWUiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInRlbXBsYXRlVXJsIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwicmVzb2x2ZSIsImF1dGhvciIsIlVzZXJGYWN0b3J5IiwiJHN0YXRlUGFyYW1zIiwiZmV0Y2hCeUlkIiwiYXV0aG9ySWQiLCIkc2NvcGUiLCJTdG9yeUZhY3RvcnkiLCJtZXNzYWdlcyIsInN0b3J5IiwibmV3U3RvcnkiLCJwYWdlcyIsInBvcyIsImxlbmd0aCIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJpbWFnZV91cmwiLCJjb250ZW50IiwiaWQiLCJpbWFnZXMiLCJpIiwicHVzaCIsInRvU3RyaW5nIiwiZ2VucmVzIiwidHlwZSIsImltYWdlIiwic2VsZWN0R2VucmUiLCJjb25zb2xlIiwibG9nIiwic2Nyb2xsIiwiZ29CYWNrIiwibmV4dFBhZ2UiLCJzdWJtaXRUaXRsZSIsInN1Ym1pdFBhZ2UiLCJzZWxlY3RDb3ZlciIsInNlbGVjdFBhZ2VJbWFnZSIsInB1Ymxpc2giLCJ1cGRhdGVTdG9yeSIsInB1Ymxpc2hTdG9yeSIsInBhZ2VVcGRhdGUiLCJzYXZlU3RvcnkiLCJkZWxldGVQYWdlIiwic3BsaWNlIiwiRXJyb3IiLCJmYWN0b3J5IiwiaW8iLCJvcmlnaW4iLCJjb25zdGFudCIsImxvZ2luU3VjY2VzcyIsImxvZ2luRmFpbGVkIiwibG9nb3V0U3VjY2VzcyIsInNlc3Npb25UaW1lb3V0Iiwibm90QXV0aGVudGljYXRlZCIsIm5vdEF1dGhvcml6ZWQiLCIkcSIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCJyZXNwb25zZSIsIiRicm9hZGNhc3QiLCJyZWplY3QiLCIkaHR0cFByb3ZpZGVyIiwiaW50ZXJjZXB0b3JzIiwiJGluamVjdG9yIiwiZ2V0Iiwic2VydmljZSIsIiRodHRwIiwiU2Vzc2lvbiIsIm9uU3VjY2Vzc2Z1bExvZ2luIiwiY3JlYXRlIiwiZnJvbVNlcnZlciIsImNhdGNoIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJ1c2VycyIsImZldGNoQWxsIiwiY3JlYXRlTmV3IiwiZXJyb3IiLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJhdXRob3JzIiwiZmlsdGVyIiwic3RvcmllcyIsImZvckVhY2giLCJ3cml0ZXIiLCJzdG9yeUlkIiwidm9pY2UiLCJzcGVlY2hTeW50aGVzaXMiLCJyZWFkQWxvdWQiLCJ0ZXh0IiwiY2FuY2VsIiwibXNnIiwiU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIiwic3BlYWsiLCJzdG9yeUZhY3RvcnkiLCJiYXNlVXJsIiwiZmV0Y2hQdWJsaXNoZWQiLCJwdWJsaXNoZWRTdG9yaWVzIiwiYWxsU3RvcmllcyIsImZldGNoVXNlclN0b3JpZXMiLCJwdWJsaXNoZWRTdG9yeSIsInB1dCIsInVwZGF0ZWRTdG9yeSIsInJlYWQiLCJzb25nIiwic29uZ1RvUGxheSIsInVzZXJGYWN0b3J5IiwidW5maW5pc2hlZFN0b3JpZXMiLCJyZXN1bWUiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNBRix1QkFBQUcsU0FBQSxDQUFBLEdBQUE7QUFDQTtBQUNBSCx1QkFBQUksSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBVCxlQUFBVSxRQUFBLENBQUFDLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7QUFXQTtBQUNBVixJQUFBVyxHQUFBLENBQUEsVUFBQUMsVUFBQSxFQUFBQyxXQUFBLEVBQUFDLE1BQUEsRUFBQTs7QUFFQTtBQUNBLFFBQUFDLCtCQUFBLFNBQUFBLDRCQUFBLENBQUFDLEtBQUEsRUFBQTtBQUNBLGVBQUFBLE1BQUFDLElBQUEsSUFBQUQsTUFBQUMsSUFBQSxDQUFBQyxZQUFBO0FBQ0EsS0FGQTs7QUFJQTtBQUNBO0FBQ0FOLGVBQUFPLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUFDLEtBQUEsRUFBQUMsT0FBQSxFQUFBQyxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBUCw2QkFBQU0sT0FBQSxDQUFBLEVBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxZQUFBUixZQUFBVSxlQUFBLEVBQUEsRUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0FILGNBQUFJLGNBQUE7O0FBRUFYLG9CQUFBWSxlQUFBLEdBQUFDLElBQUEsQ0FBQSxVQUFBQyxJQUFBLEVBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBQUEsSUFBQSxFQUFBO0FBQ0FiLHVCQUFBYyxFQUFBLENBQUFQLFFBQUFRLElBQUEsRUFBQVAsUUFBQTtBQUNBLGFBRkEsTUFFQTtBQUNBUix1QkFBQWMsRUFBQSxDQUFBLE9BQUE7QUFDQTtBQUNBLFNBVEE7QUFXQSxLQTVCQTtBQThCQSxDQXZDQTs7QUNmQTVCLElBQUE4QixTQUFBLENBQUEsU0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0FDLGtCQUFBLEdBREE7QUFFQUMscUJBQUE7QUFGQSxLQUFBO0FBSUEsQ0FMQTtBQ0FBaEMsSUFBQUcsTUFBQSxDQUFBLFVBQUE4QixjQUFBLEVBQUE7QUFDQUEsbUJBQUFqQixLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0FrQixhQUFBLG1CQURBO0FBRUFGLHFCQUFBLHVCQUZBO0FBR0FHLG9CQUFBLFlBSEE7QUFJQUMsaUJBQUE7QUFDQUMsb0JBQUEsZ0JBQUFDLFdBQUEsRUFBQUMsWUFBQSxFQUFBO0FBQ0EsdUJBQUFELFlBQUFFLFNBQUEsQ0FBQUQsYUFBQUUsUUFBQSxDQUFBO0FBQ0E7QUFIQTtBQUpBLEtBQUE7QUFVQSxDQVhBOztBQWFBekMsSUFBQW1DLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQU8sTUFBQSxFQUFBTCxNQUFBLEVBQUE7QUFDQUssV0FBQUwsTUFBQSxHQUFBQSxNQUFBO0FBQ0EsQ0FGQTtBQ2JBckMsSUFBQUcsTUFBQSxDQUFBLFVBQUE4QixjQUFBLEVBQUE7QUFDQUEsbUJBQUFqQixLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0FrQixhQUFBLFNBREE7QUFFQUYscUJBQUEsdUJBRkE7QUFHQUcsb0JBQUEsWUFIQTtBQUlBQyxpQkFBQTtBQUNBVCxrQkFBQSxjQUFBZCxXQUFBLEVBQUE7QUFDQSx1QkFBQUEsWUFBQVksZUFBQSxFQUFBO0FBQ0E7QUFIQTtBQUpBLEtBQUE7QUFVQSxDQVhBOztBQWFBekIsSUFBQW1DLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQU8sTUFBQSxFQUFBQyxZQUFBLEVBQUE3QixNQUFBLEVBQUFhLElBQUEsRUFBQWYsVUFBQSxFQUFBO0FBQ0E4QixXQUFBRSxRQUFBLEdBQUEsQ0FBQSxtQ0FBQSxFQUFBLHFDQUFBLEVBQUEsMEJBQUEsQ0FBQTtBQUNBLFFBQUFoQyxXQUFBaUMsS0FBQSxFQUFBO0FBQ0FILGVBQUFJLFFBQUEsR0FBQWxDLFdBQUFpQyxLQUFBO0FBQ0FILGVBQUFLLEtBQUEsR0FBQUwsT0FBQUksUUFBQSxDQUFBQyxLQUFBO0FBQ0FMLGVBQUFNLEdBQUEsR0FBQU4sT0FBQUssS0FBQSxDQUFBRSxNQUFBO0FBQ0EsS0FKQSxNQUlBO0FBQ0FQLGVBQUFJLFFBQUEsR0FBQTtBQUNBSSxtQkFBQSxjQURBO0FBRUFDLG9CQUFBLFlBRkE7QUFHQUMsdUJBQUEsbUJBSEE7QUFJQUMsbUJBQUEsTUFKQTtBQUtBQyxvQkFBQSxDQUxBO0FBTUFQLG1CQUFBO0FBTkEsU0FBQTtBQVFBTCxlQUFBSyxLQUFBLEdBQUEsQ0FDQTtBQUNBUSx1QkFBQSxtQkFEQTtBQUVBQyxxQkFBQTtBQUZBLFNBREEsQ0FBQTtBQU1BZCxlQUFBTSxHQUFBLEdBQUEsQ0FBQTtBQUNBOztBQUVBTixXQUFBTCxNQUFBLEdBQUEsV0FBQTtBQUNBLFFBQUFWLElBQUEsRUFBQTtBQUNBZSxlQUFBTCxNQUFBLEdBQUFWLEtBQUFFLElBQUE7QUFDQWEsZUFBQUksUUFBQSxDQUFBUSxNQUFBLEdBQUEzQixLQUFBOEIsRUFBQTtBQUNBOztBQUVBZixXQUFBZ0IsTUFBQSxHQUFBLEVBQUE7QUFDQSxTQUFBLElBQUFDLElBQUEsQ0FBQSxFQUFBQSxJQUFBLEdBQUEsRUFBQUEsR0FBQSxFQUFBOztBQUVBakIsZUFBQWdCLE1BQUEsQ0FBQUUsSUFBQSxDQUFBRCxFQUFBRSxRQUFBLEtBQUEsTUFBQTtBQUNBOztBQUtBbkIsV0FBQW9CLE1BQUEsR0FBQSxDQUNBO0FBQ0FDLGNBQUEsaUJBREE7QUFFQUMsZUFBQTtBQUZBLEtBREEsRUFLQTtBQUNBRCxjQUFBLG1CQURBO0FBRUFDLGVBQUE7QUFGQSxLQUxBLEVBU0E7QUFDQUQsY0FBQSxZQURBO0FBRUFDLGVBQUE7QUFGQSxLQVRBLEVBYUE7QUFDQUQsY0FBQSxTQURBO0FBRUFDLGVBQUE7QUFGQSxLQWJBLEVBaUJBO0FBQ0FELGNBQUEsU0FEQTtBQUVBQyxlQUFBO0FBRkEsS0FqQkEsRUFxQkE7QUFDQUQsY0FBQSxRQURBO0FBRUFDLGVBQUE7QUFGQSxLQXJCQSxFQXlCQTtBQUNBRCxjQUFBLFVBREE7QUFFQUMsZUFBQTtBQUZBLEtBekJBLEVBNkJBO0FBQ0FELGNBQUEsUUFEQTtBQUVBQyxlQUFBO0FBRkEsS0E3QkEsQ0FBQTs7QUFtQ0F0QixXQUFBdUIsV0FBQSxHQUFBLFVBQUFaLEtBQUEsRUFBQTtBQUNBWCxlQUFBSSxRQUFBLENBQUFPLEtBQUEsR0FBQUEsS0FBQTtBQUNBYSxnQkFBQUMsR0FBQSxDQUFBekIsT0FBQUksUUFBQSxDQUFBTyxLQUFBO0FBQ0FYLGVBQUFNLEdBQUE7QUFDQWpELGVBQUFxRSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxLQUxBOztBQU9BMUIsV0FBQTJCLE1BQUEsR0FBQSxZQUFBO0FBQ0EzQixlQUFBTSxHQUFBO0FBQ0EsS0FGQTtBQUdBTixXQUFBNEIsUUFBQSxHQUFBLFlBQUE7QUFDQTVCLGVBQUFNLEdBQUE7QUFDQSxLQUZBOztBQUlBTixXQUFBNkIsV0FBQSxHQUFBLFlBQUE7QUFDQTdCLGVBQUFNLEdBQUE7QUFDQWpELGVBQUFxRSxNQUFBLENBQUEsQ0FBQSxFQUFBLENBQUE7QUFDQSxLQUhBO0FBSUExQixXQUFBOEIsVUFBQSxHQUFBLFlBQUE7QUFDQTlCLGVBQUFLLEtBQUEsQ0FBQWEsSUFBQSxDQUFBLEVBQUFMLFdBQUEsbUJBQUEsRUFBQUMsU0FBQSxFQUFBLEVBQUE7QUFDQWQsZUFBQU0sR0FBQSxHQUFBTixPQUFBSyxLQUFBLENBQUFFLE1BQUEsR0FBQSxDQUFBO0FBQ0FsRCxlQUFBcUUsTUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBO0FBQ0EsS0FKQTtBQUtBMUIsV0FBQStCLFdBQUEsR0FBQSxVQUFBdkMsR0FBQSxFQUFBO0FBQ0FRLGVBQUFJLFFBQUEsQ0FBQU0sU0FBQSxHQUFBbEIsR0FBQTtBQUNBLEtBRkE7QUFHQVEsV0FBQWdDLGVBQUEsR0FBQSxVQUFBeEMsR0FBQSxFQUFBO0FBQ0FRLGVBQUFLLEtBQUEsQ0FBQUwsT0FBQU0sR0FBQSxHQUFBLENBQUEsRUFBQU8sU0FBQSxHQUFBckIsR0FBQTtBQUNBLEtBRkE7QUFHQVEsV0FBQWlDLE9BQUEsR0FBQSxZQUFBO0FBQ0FqQyxlQUFBSSxRQUFBLENBQUFLLE1BQUEsR0FBQSxXQUFBO0FBQ0FULGVBQUFJLFFBQUEsQ0FBQUMsS0FBQSxHQUFBTCxPQUFBSyxLQUFBO0FBQ0EsWUFBQUwsT0FBQUksUUFBQSxDQUFBVyxFQUFBLEVBQUE7QUFDQWQseUJBQUFpQyxXQUFBLENBQUFsQyxPQUFBSSxRQUFBO0FBQ0EsU0FGQSxNQUVBO0FBQ0FILHlCQUFBa0MsWUFBQSxDQUFBbkMsT0FBQUksUUFBQTtBQUNBO0FBQ0FsQyxtQkFBQWtFLFVBQUEsR0FBQSxJQUFBO0FBRUEsS0FWQTs7QUFZQXBDLFdBQUFxQyxTQUFBLEdBQUEsWUFBQTtBQUNBckMsZUFBQUksUUFBQSxDQUFBQyxLQUFBLEdBQUFMLE9BQUFLLEtBQUE7QUFDQSxZQUFBTCxPQUFBSSxRQUFBLENBQUFXLEVBQUEsRUFBQTtBQUNBZCx5QkFBQWlDLFdBQUEsQ0FBQWxDLE9BQUFJLFFBQUE7QUFDQSxTQUZBLE1BRUE7QUFDQUgseUJBQUFrQyxZQUFBLENBQUFuQyxPQUFBSSxRQUFBO0FBQ0E7QUFDQWxDLG1CQUFBa0UsVUFBQSxHQUFBLElBQUE7QUFDQSxLQVJBOztBQVVBcEMsV0FBQXNDLFVBQUEsR0FBQSxZQUFBO0FBQ0F0QyxlQUFBSyxLQUFBLENBQUFrQyxNQUFBLENBQUF2QyxPQUFBTSxHQUFBLEdBQUEsQ0FBQSxFQUFBLENBQUE7QUFDQU4sZUFBQU0sR0FBQTtBQUNBLEtBSEE7QUFJQSxDQWpJQTtBQ2JBLENBQUEsWUFBQTs7QUFFQTs7QUFFQTs7QUFDQSxRQUFBLENBQUFqRCxPQUFBRSxPQUFBLEVBQUEsTUFBQSxJQUFBaUYsS0FBQSxDQUFBLHdCQUFBLENBQUE7O0FBRUEsUUFBQWxGLE1BQUFDLFFBQUFDLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBOztBQUVBRixRQUFBbUYsT0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsWUFBQSxDQUFBcEYsT0FBQXFGLEVBQUEsRUFBQSxNQUFBLElBQUFGLEtBQUEsQ0FBQSxzQkFBQSxDQUFBO0FBQ0EsZUFBQW5GLE9BQUFxRixFQUFBLENBQUFyRixPQUFBVSxRQUFBLENBQUE0RSxNQUFBLENBQUE7QUFDQSxLQUhBOztBQUtBO0FBQ0E7QUFDQTtBQUNBckYsUUFBQXNGLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQUMsc0JBQUEsb0JBREE7QUFFQUMscUJBQUEsbUJBRkE7QUFHQUMsdUJBQUEscUJBSEE7QUFJQUMsd0JBQUEsc0JBSkE7QUFLQUMsMEJBQUEsd0JBTEE7QUFNQUMsdUJBQUE7QUFOQSxLQUFBOztBQVNBNUYsUUFBQW1GLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUF2RSxVQUFBLEVBQUFpRixFQUFBLEVBQUFDLFdBQUEsRUFBQTtBQUNBLFlBQUFDLGFBQUE7QUFDQSxpQkFBQUQsWUFBQUgsZ0JBREE7QUFFQSxpQkFBQUcsWUFBQUYsYUFGQTtBQUdBLGlCQUFBRSxZQUFBSixjQUhBO0FBSUEsaUJBQUFJLFlBQUFKO0FBSkEsU0FBQTtBQU1BLGVBQUE7QUFDQU0sMkJBQUEsdUJBQUFDLFFBQUEsRUFBQTtBQUNBckYsMkJBQUFzRixVQUFBLENBQUFILFdBQUFFLFNBQUE5QyxNQUFBLENBQUEsRUFBQThDLFFBQUE7QUFDQSx1QkFBQUosR0FBQU0sTUFBQSxDQUFBRixRQUFBLENBQUE7QUFDQTtBQUpBLFNBQUE7QUFNQSxLQWJBOztBQWVBakcsUUFBQUcsTUFBQSxDQUFBLFVBQUFpRyxhQUFBLEVBQUE7QUFDQUEsc0JBQUFDLFlBQUEsQ0FBQXpDLElBQUEsQ0FBQSxDQUNBLFdBREEsRUFFQSxVQUFBMEMsU0FBQSxFQUFBO0FBQ0EsbUJBQUFBLFVBQUFDLEdBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsU0FKQSxDQUFBO0FBTUEsS0FQQTs7QUFTQXZHLFFBQUF3RyxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUFDLEtBQUEsRUFBQUMsT0FBQSxFQUFBOUYsVUFBQSxFQUFBa0YsV0FBQSxFQUFBRCxFQUFBLEVBQUE7O0FBRUEsaUJBQUFjLGlCQUFBLENBQUFWLFFBQUEsRUFBQTtBQUNBLGdCQUFBaEYsT0FBQWdGLFNBQUFoRixJQUFBO0FBQ0F5RixvQkFBQUUsTUFBQSxDQUFBM0YsS0FBQXdDLEVBQUEsRUFBQXhDLEtBQUFVLElBQUE7QUFDQWYsdUJBQUFzRixVQUFBLENBQUFKLFlBQUFQLFlBQUE7QUFDQSxtQkFBQXRFLEtBQUFVLElBQUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsYUFBQUosZUFBQSxHQUFBLFlBQUE7QUFDQSxtQkFBQSxDQUFBLENBQUFtRixRQUFBL0UsSUFBQTtBQUNBLFNBRkE7O0FBSUEsYUFBQUYsZUFBQSxHQUFBLFVBQUFvRixVQUFBLEVBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxnQkFBQSxLQUFBdEYsZUFBQSxNQUFBc0YsZUFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQWhCLEdBQUFyRixJQUFBLENBQUFrRyxRQUFBL0UsSUFBQSxDQUFBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUJBQUE4RSxNQUFBRixHQUFBLENBQUEsVUFBQSxFQUFBN0UsSUFBQSxDQUFBaUYsaUJBQUEsRUFBQUcsS0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxJQUFBO0FBQ0EsYUFGQSxDQUFBO0FBSUEsU0FyQkE7O0FBdUJBLGFBQUFDLEtBQUEsR0FBQSxVQUFBQyxXQUFBLEVBQUE7QUFDQSxtQkFBQVAsTUFBQVEsSUFBQSxDQUFBLFFBQUEsRUFBQUQsV0FBQSxFQUNBdEYsSUFEQSxDQUNBaUYsaUJBREEsRUFFQUcsS0FGQSxDQUVBLFlBQUE7QUFDQSx1QkFBQWpCLEdBQUFNLE1BQUEsQ0FBQSxFQUFBZSxTQUFBLDRCQUFBLEVBQUEsQ0FBQTtBQUNBLGFBSkEsQ0FBQTtBQUtBLFNBTkE7O0FBUUEsYUFBQUMsTUFBQSxHQUFBLFlBQUE7QUFDQSxtQkFBQVYsTUFBQUYsR0FBQSxDQUFBLFNBQUEsRUFBQTdFLElBQUEsQ0FBQSxZQUFBO0FBQ0FnRix3QkFBQVUsT0FBQTtBQUNBeEcsMkJBQUFzRixVQUFBLENBQUFKLFlBQUFMLGFBQUE7QUFDQSxhQUhBLENBQUE7QUFJQSxTQUxBO0FBT0EsS0FyREE7O0FBdURBekYsUUFBQXdHLE9BQUEsQ0FBQSxTQUFBLEVBQUEsVUFBQTVGLFVBQUEsRUFBQWtGLFdBQUEsRUFBQTs7QUFFQSxZQUFBdUIsT0FBQSxJQUFBOztBQUVBekcsbUJBQUFPLEdBQUEsQ0FBQTJFLFlBQUFILGdCQUFBLEVBQUEsWUFBQTtBQUNBMEIsaUJBQUFELE9BQUE7QUFDQSxTQUZBOztBQUlBeEcsbUJBQUFPLEdBQUEsQ0FBQTJFLFlBQUFKLGNBQUEsRUFBQSxZQUFBO0FBQ0EyQixpQkFBQUQsT0FBQTtBQUNBLFNBRkE7O0FBSUEsYUFBQTNELEVBQUEsR0FBQSxJQUFBO0FBQ0EsYUFBQTlCLElBQUEsR0FBQSxJQUFBOztBQUVBLGFBQUFpRixNQUFBLEdBQUEsVUFBQVUsU0FBQSxFQUFBM0YsSUFBQSxFQUFBO0FBQ0EsaUJBQUE4QixFQUFBLEdBQUE2RCxTQUFBO0FBQ0EsaUJBQUEzRixJQUFBLEdBQUFBLElBQUE7QUFDQSxTQUhBOztBQUtBLGFBQUF5RixPQUFBLEdBQUEsWUFBQTtBQUNBLGlCQUFBM0QsRUFBQSxHQUFBLElBQUE7QUFDQSxpQkFBQTlCLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FIQTtBQUtBLEtBekJBO0FBMkJBLENBcElBOztBQ0FBM0IsSUFBQThCLFNBQUEsQ0FBQSxVQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQUMsa0JBQUEsR0FEQTtBQUVBQyxxQkFBQTtBQUZBLEtBQUE7QUFJQSxDQUxBO0FDQUFoQyxJQUFBRyxNQUFBLENBQUEsVUFBQThCLGNBQUEsRUFBQTtBQUNBQSxtQkFBQWpCLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQWtCLGFBQUEsR0FEQTtBQUVBRixxQkFBQSxtQkFGQTtBQUdBRyxvQkFBQSxVQUhBO0FBSUFDLGlCQUFBO0FBQ0FtRixtQkFBQSxlQUFBakYsV0FBQSxFQUFBO0FBQ0EsdUJBQUFBLFlBQUFrRixRQUFBLEVBQUE7QUFDQSxhQUhBO0FBSUE3RixrQkFBQSxjQUFBZCxXQUFBLEVBQUE7QUFDQSx1QkFBQUEsWUFBQVksZUFBQSxFQUFBO0FBQ0E7QUFOQTtBQUpBLEtBQUE7QUFhQSxDQWRBOztBQWdCQXpCLElBQUFtQyxVQUFBLENBQUEsVUFBQSxFQUFBLFVBQUFPLE1BQUEsRUFBQTZFLEtBQUEsRUFBQTVGLElBQUEsRUFBQWYsVUFBQSxFQUFBRSxNQUFBLEVBQUE7QUFDQTRCLFdBQUFmLElBQUEsR0FBQUEsSUFBQTtBQUNBZSxXQUFBK0UsU0FBQSxHQUFBLFlBQUE7QUFDQTdHLG1CQUFBaUMsS0FBQSxHQUFBLElBQUE7QUFDQSxLQUZBO0FBSUEsQ0FOQTtBQ2hCQTdDLElBQUFHLE1BQUEsQ0FBQSxVQUFBOEIsY0FBQSxFQUFBOztBQUVBQSxtQkFBQWpCLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQWtCLGFBQUEsUUFEQTtBQUVBRixxQkFBQSxxQkFGQTtBQUdBRyxvQkFBQTtBQUhBLEtBQUE7QUFNQSxDQVJBOztBQVVBbkMsSUFBQW1DLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQU8sTUFBQSxFQUFBN0IsV0FBQSxFQUFBQyxNQUFBLEVBQUE7O0FBRUE0QixXQUFBcUUsS0FBQSxHQUFBLEVBQUE7QUFDQXJFLFdBQUFnRixLQUFBLEdBQUEsSUFBQTs7QUFFQWhGLFdBQUFpRixTQUFBLEdBQUEsVUFBQUMsU0FBQSxFQUFBOztBQUVBbEYsZUFBQWdGLEtBQUEsR0FBQSxJQUFBOztBQUVBN0csb0JBQUFrRyxLQUFBLENBQUFhLFNBQUEsRUFBQWxHLElBQUEsQ0FBQSxZQUFBO0FBQ0FaLG1CQUFBYyxFQUFBLENBQUEsTUFBQTtBQUNBLFNBRkEsRUFFQWtGLEtBRkEsQ0FFQSxZQUFBO0FBQ0FwRSxtQkFBQWdGLEtBQUEsR0FBQSw0QkFBQTtBQUNBLFNBSkE7QUFNQSxLQVZBO0FBWUEsQ0FqQkE7QUNWQTFILElBQUFHLE1BQUEsQ0FBQSxVQUFBOEIsY0FBQSxFQUFBO0FBQ0FBLG1CQUFBakIsS0FBQSxDQUFBLGVBQUEsRUFBQTtBQUNBa0IsYUFBQSxTQURBO0FBRUFGLHFCQUFBLDhCQUZBO0FBR0FHLG9CQUFBLG1CQUhBO0FBSUFDLGlCQUFBO0FBQ0F5RixxQkFBQSxpQkFBQXZGLFdBQUEsRUFBQTtBQUNBLHVCQUFBQSxZQUFBa0YsUUFBQSxFQUFBO0FBQ0E7QUFIQTtBQUpBLEtBQUE7QUFVQSxDQVhBOztBQWFBeEgsSUFBQW1DLFVBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUFPLE1BQUEsRUFBQW1GLE9BQUEsRUFBQTtBQUNBbkYsV0FBQW1GLE9BQUEsR0FBQUEsUUFBQUMsTUFBQSxDQUFBLFVBQUF6RixNQUFBLEVBQUE7QUFDQSxlQUFBQSxPQUFBMEYsT0FBQSxDQUFBOUUsTUFBQTtBQUNBLEtBRkEsQ0FBQTs7QUFJQVAsV0FBQXFGLE9BQUEsR0FBQSxFQUFBO0FBQ0FyRixXQUFBbUYsT0FBQSxDQUFBRyxPQUFBLENBQUEsVUFBQUMsTUFBQSxFQUFBO0FBQ0FBLGVBQUFGLE9BQUEsQ0FBQUMsT0FBQSxDQUFBLFVBQUFuRixLQUFBLEVBQUE7QUFDQUEsa0JBQUFSLE1BQUEsR0FBQTRGLE9BQUFwRyxJQUFBO0FBQ0FnQixrQkFBQUosUUFBQSxHQUFBd0YsT0FBQXhFLEVBQUE7QUFDQSxnQkFBQVosTUFBQU0sTUFBQSxLQUFBLFdBQUEsRUFBQTtBQUNBVCx1QkFBQXFGLE9BQUEsQ0FBQW5FLElBQUEsQ0FBQWYsS0FBQTtBQUNBO0FBRUEsU0FQQTtBQVFBLEtBVEE7O0FBV0EsUUFBQWlCLFNBQUEsQ0FBQSxpQkFBQSxFQUFBLG1CQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLFVBQUEsRUFBQSxRQUFBLENBQUE7QUFDQXBCLFdBQUFvQixNQUFBLEdBQUEsRUFBQTtBQUNBLFNBQUEsSUFBQUgsSUFBQSxDQUFBLEVBQUFBLElBQUFHLE9BQUFiLE1BQUEsRUFBQVUsR0FBQSxFQUFBO0FBQ0FqQixlQUFBb0IsTUFBQSxDQUFBRixJQUFBLENBQUFsQixPQUFBcUYsT0FBQSxDQUFBRCxNQUFBLENBQUEsVUFBQWpGLEtBQUEsRUFBQTtBQUNBLG1CQUFBQSxNQUFBUSxLQUFBLEtBQUFTLE9BQUFILENBQUEsQ0FBQTtBQUNBLFNBRkEsQ0FBQTtBQUdBO0FBRUEsQ0F6QkE7QUNiQTNELElBQUFHLE1BQUEsQ0FBQSxVQUFBOEIsY0FBQSxFQUFBO0FBQ0FBLG1CQUFBakIsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBa0IsYUFBQSxpQkFEQTtBQUVBRixxQkFBQSw0QkFGQTtBQUdBRyxvQkFBQSxpQkFIQTtBQUlBQyxpQkFBQTtBQUNBUyxtQkFBQSxlQUFBRixZQUFBLEVBQUFKLFlBQUEsRUFBQTtBQUNBLHVCQUFBSSxhQUFBSCxTQUFBLENBQUFELGFBQUEyRixPQUFBLENBQUE7QUFDQSxhQUhBO0FBSUE3RixvQkFBQSxnQkFBQUMsV0FBQSxFQUFBTyxLQUFBLEVBQUE7QUFDQSx1QkFBQVAsWUFBQUUsU0FBQSxDQUFBSyxNQUFBUyxNQUFBLENBQUE7QUFDQTtBQU5BO0FBSkEsS0FBQTtBQWFBLENBZEE7O0FBZ0JBdEQsSUFBQW1DLFVBQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUFPLE1BQUEsRUFBQUMsWUFBQSxFQUFBRSxLQUFBLEVBQUFSLE1BQUEsRUFBQTtBQUNBSyxXQUFBTCxNQUFBLEdBQUFBLE1BQUE7QUFDQUssV0FBQUksUUFBQSxHQUFBRCxLQUFBO0FBQ0FILFdBQUFLLEtBQUEsR0FBQUYsTUFBQUUsS0FBQTtBQUNBbUIsWUFBQUMsR0FBQSxDQUFBLDRCQUFBLEVBQUF0QixLQUFBO0FBQ0EsUUFBQXNGLFFBQUFwSSxPQUFBcUksZUFBQTs7QUFFQTFGLFdBQUEyRixTQUFBLEdBQUEsVUFBQUMsSUFBQSxFQUFBOztBQUVBSCxjQUFBSSxNQUFBO0FBQ0EsWUFBQUMsTUFBQSxJQUFBQyx3QkFBQSxDQUFBSCxJQUFBLENBQUE7QUFDQUgsY0FBQU8sS0FBQSxDQUFBRixHQUFBO0FBQ0EsS0FMQTtBQU1BLENBYkE7QUNoQkF4SSxJQUFBbUYsT0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBc0IsS0FBQSxFQUFBM0YsTUFBQSxFQUFBO0FBQ0EsUUFBQTZILGVBQUEsRUFBQTtBQUNBLFFBQUFDLFVBQUEsZUFBQTs7QUFFQUQsaUJBQUFFLGNBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQXBDLE1BQUFGLEdBQUEsQ0FBQXFDLE9BQUEsRUFDQWxILElBREEsQ0FDQSxVQUFBb0gsZ0JBQUEsRUFBQTtBQUNBLG1CQUFBQSxpQkFBQTdILElBQUE7QUFDQSxTQUhBLENBQUE7QUFJQSxLQUxBOztBQU9BMEgsaUJBQUFuQixRQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUFmLE1BQUFGLEdBQUEsQ0FBQXFDLFVBQUEsS0FBQSxFQUNBbEgsSUFEQSxDQUNBLFVBQUFxSCxVQUFBLEVBQUE7QUFDQSxtQkFBQUEsV0FBQTlILElBQUE7QUFDQSxTQUhBLENBQUE7QUFJQSxLQUxBOztBQU9BMEgsaUJBQUFuRyxTQUFBLEdBQUEsVUFBQTBGLE9BQUEsRUFBQTtBQUNBLGVBQUF6QixNQUFBRixHQUFBLENBQUFxQyxVQUFBLFFBQUEsR0FBQVYsT0FBQSxFQUNBeEcsSUFEQSxDQUNBLFVBQUFtQixLQUFBLEVBQUE7QUFDQXFCLG9CQUFBQyxHQUFBLENBQUF0QixNQUFBNUIsSUFBQTtBQUNBLG1CQUFBNEIsTUFBQTVCLElBQUE7QUFDQSxTQUpBLENBQUE7QUFLQSxLQU5BOztBQVFBMEgsaUJBQUFLLGdCQUFBLEdBQUEsVUFBQTFGLE1BQUEsRUFBQTtBQUNBLGVBQUFtRCxNQUFBRixHQUFBLENBQUFxQyxVQUFBLE9BQUEsR0FBQXRGLE1BQUEsRUFDQTVCLElBREEsQ0FDQSxVQUFBcUcsT0FBQSxFQUFBO0FBQ0E3RCxvQkFBQUMsR0FBQSxDQUFBNEQsUUFBQTlHLElBQUE7QUFDQSxtQkFBQThHLFFBQUE5RyxJQUFBO0FBQ0EsU0FKQSxDQUFBO0FBS0EsS0FOQTs7QUFRQTBILGlCQUFBOUQsWUFBQSxHQUFBLFVBQUFoQyxLQUFBLEVBQUE7QUFDQSxlQUFBNEQsTUFBQVEsSUFBQSxDQUFBMkIsT0FBQSxFQUFBL0YsS0FBQSxFQUNBbkIsSUFEQSxDQUNBLFVBQUF1SCxjQUFBLEVBQUE7QUFDQSxtQkFBQUEsZUFBQWhJLElBQUE7QUFDQSxTQUhBLEVBSUFTLElBSkEsQ0FJQSxVQUFBbUIsS0FBQSxFQUFBO0FBQ0EvQixtQkFBQWMsRUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBc0csU0FBQXJGLE1BQUFZLEVBQUEsRUFBQTtBQUNBLFNBTkEsQ0FBQTtBQVFBLEtBVEE7O0FBV0FrRixpQkFBQS9ELFdBQUEsR0FBQSxVQUFBL0IsS0FBQSxFQUFBO0FBQ0EsZUFBQTRELE1BQUF5QyxHQUFBLENBQUFOLFVBQUEvRixNQUFBWSxFQUFBLEVBQUFaLEtBQUEsRUFDQW5CLElBREEsQ0FDQSxVQUFBeUgsWUFBQSxFQUFBO0FBQ0EsbUJBQUFBLGFBQUFsSSxJQUFBO0FBQ0EsU0FIQSxDQUFBO0FBSUEsS0FMQTs7QUFPQTBILGlCQUFBUyxJQUFBLEdBQUEsVUFBQWQsSUFBQSxFQUFBO0FBQ0EsZUFBQTdCLE1BQUFGLEdBQUEsQ0FBQSxnRkFBQStCLElBQUEsRUFDQTVHLElBREEsQ0FDQSxVQUFBMkgsSUFBQSxFQUFBO0FBQ0EsbUJBQUFBLEtBQUFwSSxJQUFBO0FBQ0EsU0FIQSxFQUlBUyxJQUpBLENBSUEsVUFBQTRILFVBQUEsRUFBQTtBQUNBcEYsb0JBQUFDLEdBQUEsQ0FBQW1GLFVBQUE7QUFFQSxTQVBBLENBQUE7QUFRQSxLQVRBOztBQWFBLFdBQUFYLFlBQUE7QUFFQSxDQW5FQTtBQ0FBM0ksSUFBQW1GLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQXNCLEtBQUEsRUFBQTNGLE1BQUEsRUFBQTtBQUNBLFFBQUF5SSxjQUFBLEVBQUE7QUFDQSxRQUFBWCxVQUFBLGFBQUE7O0FBSUFXLGdCQUFBL0csU0FBQSxHQUFBLFVBQUFjLE1BQUEsRUFBQTtBQUNBLGVBQUFtRCxNQUFBRixHQUFBLENBQUFxQyxVQUFBdEYsTUFBQSxFQUNBNUIsSUFEQSxDQUNBLFVBQUFDLElBQUEsRUFBQTtBQUNBLG1CQUFBQSxLQUFBVixJQUFBO0FBQ0EsU0FIQSxDQUFBO0FBSUEsS0FMQTs7QUFPQXNJLGdCQUFBL0IsUUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBZixNQUFBRixHQUFBLENBQUFxQyxPQUFBLEVBQ0FsSCxJQURBLENBQ0EsVUFBQTZGLEtBQUEsRUFBQTtBQUNBLG1CQUFBQSxNQUFBdEcsSUFBQTtBQUNBLFNBSEEsQ0FBQTtBQUlBLEtBTEE7O0FBT0EsV0FBQXNJLFdBQUE7QUFDQSxDQXJCQTtBQ0FBdkosSUFBQUcsTUFBQSxDQUFBLFVBQUE4QixjQUFBLEVBQUE7QUFDQUEsbUJBQUFqQixLQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0FrQixhQUFBLGNBREE7QUFFQUYscUJBQUEsMkJBRkE7QUFHQUcsb0JBQUEsaUJBSEE7QUFJQUMsaUJBQUE7QUFDQVQsa0JBQUEsY0FBQWQsV0FBQSxFQUFBO0FBQ0EsdUJBQUFBLFlBQUFZLGVBQUEsRUFBQTtBQUNBO0FBSEE7QUFKQSxLQUFBO0FBVUEsQ0FYQTs7QUFhQXpCLElBQUFtQyxVQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBTyxNQUFBLEVBQUFmLElBQUEsRUFBQWYsVUFBQSxFQUFBRSxNQUFBLEVBQUFELFdBQUEsRUFBQTs7QUFFQSxRQUFBRCxXQUFBa0UsVUFBQSxFQUFBO0FBQ0EvRSxlQUFBVSxRQUFBLENBQUFDLE1BQUE7QUFDQUUsbUJBQUFrRSxVQUFBLEdBQUEsS0FBQTtBQUNBOztBQUVBcEMsV0FBQWYsSUFBQSxHQUFBQSxJQUFBO0FBQ0FlLFdBQUFvRyxnQkFBQSxHQUFBcEcsT0FBQWYsSUFBQSxDQUFBb0csT0FBQSxDQUFBRCxNQUFBLENBQUEsVUFBQWpGLEtBQUEsRUFBQTtBQUNBLGVBQUFBLE1BQUFNLE1BQUEsS0FBQSxXQUFBO0FBQ0EsS0FGQSxDQUFBO0FBR0FULFdBQUE4RyxpQkFBQSxHQUFBOUcsT0FBQWYsSUFBQSxDQUFBb0csT0FBQSxDQUFBRCxNQUFBLENBQUEsVUFBQWpGLEtBQUEsRUFBQTtBQUNBLGVBQUFBLE1BQUFNLE1BQUEsS0FBQSxXQUFBO0FBQ0EsS0FGQSxDQUFBOztBQUlBVCxXQUFBK0csTUFBQSxHQUFBLFVBQUE1RyxLQUFBLEVBQUE7QUFDQWpDLG1CQUFBaUMsS0FBQSxHQUFBQSxLQUFBO0FBQ0EsS0FGQTtBQUdBLENBbEJBO0FDYkE3QyxJQUFBbUYsT0FBQSxDQUFBLGVBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxDQUNBLHVEQURBLEVBRUEscUhBRkEsRUFHQSxpREFIQSxFQUlBLGlEQUpBLEVBS0EsdURBTEEsRUFNQSx1REFOQSxFQU9BLHVEQVBBLEVBUUEsdURBUkEsRUFTQSx1REFUQSxFQVVBLHVEQVZBLEVBV0EsdURBWEEsRUFZQSx1REFaQSxFQWFBLHVEQWJBLEVBY0EsdURBZEEsRUFlQSx1REFmQSxFQWdCQSx1REFoQkEsRUFpQkEsdURBakJBLEVBa0JBLHVEQWxCQSxFQW1CQSx1REFuQkEsRUFvQkEsdURBcEJBLEVBcUJBLHVEQXJCQSxFQXNCQSx1REF0QkEsRUF1QkEsdURBdkJBLEVBd0JBLHVEQXhCQSxFQXlCQSx1REF6QkEsRUEwQkEsdURBMUJBLENBQUE7QUE0QkEsQ0E3QkE7O0FDQUFuRixJQUFBbUYsT0FBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTs7QUFFQSxRQUFBdUUscUJBQUEsU0FBQUEsa0JBQUEsQ0FBQUMsR0FBQSxFQUFBO0FBQ0EsZUFBQUEsSUFBQUMsS0FBQUMsS0FBQSxDQUFBRCxLQUFBRSxNQUFBLEtBQUFILElBQUExRyxNQUFBLENBQUEsQ0FBQTtBQUNBLEtBRkE7O0FBSUEsUUFBQThHLFlBQUEsQ0FDQSxlQURBLEVBRUEsdUJBRkEsRUFHQSxzQkFIQSxFQUlBLHVCQUpBLEVBS0EseURBTEEsRUFNQSwwQ0FOQSxFQU9BLGNBUEEsRUFRQSx1QkFSQSxFQVNBLElBVEEsRUFVQSxpQ0FWQSxFQVdBLDBEQVhBLEVBWUEsNkVBWkEsQ0FBQTs7QUFlQSxXQUFBO0FBQ0FBLG1CQUFBQSxTQURBO0FBRUFDLDJCQUFBLDZCQUFBO0FBQ0EsbUJBQUFOLG1CQUFBSyxTQUFBLENBQUE7QUFDQTtBQUpBLEtBQUE7QUFPQSxDQTVCQTs7QUNBQS9KLElBQUE4QixTQUFBLENBQUEsZUFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0FDLGtCQUFBLEdBREE7QUFFQUMscUJBQUE7QUFGQSxLQUFBO0FBSUEsQ0FMQTtBQ0FBaEMsSUFBQThCLFNBQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQWxCLFVBQUEsRUFBQUMsV0FBQSxFQUFBaUYsV0FBQSxFQUFBaEYsTUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQWlCLGtCQUFBLEdBREE7QUFFQWtJLGVBQUEsRUFGQTtBQUdBakkscUJBQUEseUNBSEE7QUFJQWtJLGNBQUEsY0FBQUQsS0FBQSxFQUFBOztBQUVBQSxrQkFBQXRJLElBQUEsR0FBQSxJQUFBOztBQUVBc0ksa0JBQUFFLFVBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUF0SixZQUFBVSxlQUFBLEVBQUE7QUFDQSxhQUZBOztBQUlBMEksa0JBQUE5QyxNQUFBLEdBQUEsWUFBQTtBQUNBdEcsNEJBQUFzRyxNQUFBLEdBQUF6RixJQUFBLENBQUEsWUFBQTtBQUNBWiwyQkFBQWMsRUFBQSxDQUFBLGVBQUE7QUFDQSxpQkFGQTtBQUdBLGFBSkE7O0FBTUEsZ0JBQUF3SSxVQUFBLFNBQUFBLE9BQUEsR0FBQTtBQUNBdkosNEJBQUFZLGVBQUEsR0FBQUMsSUFBQSxDQUFBLFVBQUFDLElBQUEsRUFBQTtBQUNBc0ksMEJBQUF0SSxJQUFBLEdBQUFBLElBQUE7QUFDQSxpQkFGQTtBQUdBLGFBSkE7O0FBTUEsZ0JBQUEwSSxhQUFBLFNBQUFBLFVBQUEsR0FBQTtBQUNBSixzQkFBQXRJLElBQUEsR0FBQSxJQUFBO0FBQ0EsYUFGQTs7QUFJQXlJOztBQUVBeEosdUJBQUFPLEdBQUEsQ0FBQTJFLFlBQUFQLFlBQUEsRUFBQTZFLE9BQUE7QUFDQXhKLHVCQUFBTyxHQUFBLENBQUEyRSxZQUFBTCxhQUFBLEVBQUE0RSxVQUFBO0FBQ0F6Six1QkFBQU8sR0FBQSxDQUFBMkUsWUFBQUosY0FBQSxFQUFBMkUsVUFBQTtBQUVBOztBQWxDQSxLQUFBO0FBc0NBLENBeENBOztBQ0FBckssSUFBQThCLFNBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQXdJLGVBQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0F2SSxrQkFBQSxHQURBO0FBRUFDLHFCQUFBLHlEQUZBO0FBR0FrSSxjQUFBLGNBQUFELEtBQUEsRUFBQTtBQUNBQSxrQkFBQU0sUUFBQSxHQUFBRCxnQkFBQU4saUJBQUEsRUFBQTtBQUNBO0FBTEEsS0FBQTtBQVFBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdzbGljayddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWNjb3VudCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FjY291bnQvYWNjb3VudC5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRob3InLCB7XG4gICAgICAgIHVybDogJy9hdXRob3IvOmF1dGhvcklkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hdXRob3IvYXV0aG9yLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXV0aG9yQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLmF1dGhvcklkKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQXV0aG9yQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgYXV0aG9yKSB7XG5cdCRzY29wZS5hdXRob3IgPSBhdXRob3I7XG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY3JlYXRlL2NyZWF0ZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ3JlYXRlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCAkc3RhdGUsIHVzZXIsICRyb290U2NvcGUpIHtcblx0JHNjb3BlLm1lc3NhZ2VzID0gW1wic2VsZWN0IGEgZ2VucmUgZm9yIHlvdXIgbmV3IHN0b3J5XCIsIFwiZGVzaWduIHRoZSBjb3ZlciBvZiB5b3VyIHN0b3J5IGJvb2tcIiwgXCJkZXNpZ24geW91ciBib29rJ3MgcGFnZXNcIl1cblx0aWYgKCRyb290U2NvcGUuc3RvcnkpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkgPSAkcm9vdFNjb3BlLnN0b3J5O1xuXHRcdCRzY29wZS5wYWdlcyA9ICRzY29wZS5uZXdTdG9yeS5wYWdlcztcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aDtcblx0fSBlbHNlIHtcblx0XHQkc2NvcGUubmV3U3RvcnkgPSB7XG5cdFx0XHR0aXRsZTogXCJNeSBOZXcgU3RvcnlcIixcblx0XHRcdHN0YXR1czogXCJpbmNvbXBsZXRlXCIsXG5cdFx0XHRjb3Zlcl91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRcdGdlbnJlOiBcIm5vbmVcIixcblx0XHRcdHVzZXJJZDogMSxcblx0XHRcdHBhZ2VzOiBudWxsXG5cdFx0fVxuXHRcdCRzY29wZS5wYWdlcyA9IFtcblx0XHRcdHtcblx0XHRcdFx0aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRcdGNvbnRlbnQ6IFwiXCJcblx0XHRcdH1cblx0XHRdO1xuXHRcdCRzY29wZS5wb3MgPSAwO1xuXHR9XG5cdFxuXHQkc2NvcGUuYXV0aG9yID0gXCJhbm9ueW1vdXNcIlxuXHRpZiAodXNlcikge1xuXHRcdCRzY29wZS5hdXRob3IgPSB1c2VyLm5hbWU7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnVzZXJJZCA9IHVzZXIuaWQ7IFxuXHR9XG5cdFxuXHQkc2NvcGUuaW1hZ2VzID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgMTM2OyBpKyspIHtcblxuXHRcdCRzY29wZS5pbWFnZXMucHVzaChpLnRvU3RyaW5nKCkgKyAnLnBuZycpO1xuXHR9XG5cdFxuXG5cdFxuXG5cdCRzY29wZS5nZW5yZXMgPSBbXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1NjaWVuY2UgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3NjaWVuY2UtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JlYWxpc3RpYyBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAncmVhbGlzdGljLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdOb25maWN0aW9uJyxcblx0XHRcdGltYWdlOiAnbm9uZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0ZhbnRhc3knLFxuXHRcdFx0aW1hZ2U6ICdmYW50YXN5LmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUm9tYW5jZScsXG5cdFx0XHRpbWFnZTogJ3JvbWFuY2UuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdUcmF2ZWwnLFxuXHRcdFx0aW1hZ2U6ICd0cmF2ZWwuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdDaGlsZHJlbicsXG5cdFx0XHRpbWFnZTogJ2NoaWxkcmVuLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnSG9ycm9yJyxcblx0XHRcdGltYWdlOiAnYWR1bHQuanBnJyxcblx0XHR9XG5cdF07XG5cblx0JHNjb3BlLnNlbGVjdEdlbnJlID0gZnVuY3Rpb24oZ2VucmUpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuZ2VucmUgPSBnZW5yZTtcblx0XHRjb25zb2xlLmxvZygkc2NvcGUubmV3U3RvcnkuZ2VucmUpO1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLmdvQmFjayA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cblx0JHNjb3BlLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0fVxuXG5cdCRzY29wZS5zdWJtaXRUaXRsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cdCRzY29wZS5zdWJtaXRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnB1c2goe2ltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLCBjb250ZW50OiAnJ30pO1xuXHRcdCRzY29wZS5wb3MgPSAkc2NvcGUucGFnZXMubGVuZ3RoICsgMTtcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblx0JHNjb3BlLnNlbGVjdENvdmVyID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmNvdmVyX3VybCA9IHVybDtcblx0fVxuXHQkc2NvcGUuc2VsZWN0UGFnZUltYWdlID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLnBhZ2VzWyRzY29wZS5wb3MtMl0uaW1hZ2VfdXJsID0gdXJsO1xuXHR9XG5cdCRzY29wZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnN0YXR1cyA9IFwicHVibGlzaGVkXCI7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdGlmICgkc2NvcGUubmV3U3RvcnkuaWQpIHtcblx0XHRcdFN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSgkc2NvcGUubmV3U3RvcnkpXG5cdFx0fSBlbHNlIHtcblx0XHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KTtcblx0XHR9XG5cdFx0JHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcblx0XHRcblx0fVxuXG5cdCRzY29wZS5zYXZlU3RvcnkgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkucGFnZXMgPSAkc2NvcGUucGFnZXM7XG5cdFx0aWYgKCRzY29wZS5uZXdTdG9yeS5pZCkge1xuXHRcdFx0U3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5KCRzY29wZS5uZXdTdG9yeSlcblx0XHR9IGVsc2Uge1xuXHRcdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpO1xuXHRcdH1cblx0XHQkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuXHR9XG5cblx0JHNjb3BlLmRlbGV0ZVBhZ2UgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucGFnZXMuc3BsaWNlKCRzY29wZS5wb3MtMiwgMSk7XG5cdFx0JHNjb3BlLnBvcyAtLTtcblx0fVxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncmVldGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2dyZWV0aW5nL2dyZWV0aW5nLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXJzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCB1c2VycywgdXNlciwgJHJvb3RTY29wZSwgJHN0YXRlKSB7XG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5jcmVhdGVOZXcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RTY29wZS5zdG9yeSA9IG51bGw7XG4gICAgfVxuXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYnJvd3NlU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2Jyb3dzZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3RvcnkvYnJvd3NlLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdCcm93c2VTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Jyb3dzZVN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3JzKSB7XG5cdCRzY29wZS5hdXRob3JzID0gYXV0aG9ycy5maWx0ZXIoZnVuY3Rpb24oYXV0aG9yKSB7XG4gICAgICAgIHJldHVybiBhdXRob3Iuc3Rvcmllcy5sZW5ndGg7XG4gICAgfSlcbiAgICBcbiAgICAkc2NvcGUuc3RvcmllcyA9IFtdO1xuICAgICRzY29wZS5hdXRob3JzLmZvckVhY2goZnVuY3Rpb24od3JpdGVyKSB7XG4gICAgICAgIHdyaXRlci5zdG9yaWVzLmZvckVhY2goZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvciA9IHdyaXRlci5uYW1lO1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9ySWQgPSB3cml0ZXIuaWQ7XG4gICAgICAgICAgICBpZiAoc3Rvcnkuc3RhdHVzID09PSAncHVibGlzaGVkJykge1xuICAgICAgICAgICAgICAgJHNjb3BlLnN0b3JpZXMucHVzaChzdG9yeSk7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBcbiAgICB2YXIgZ2VucmVzID0gWydTY2llbmNlIEZpY3Rpb24nLCAnUmVhbGlzdGljIEZpY3Rpb24nLCAnTm9uZmljdGlvbicsICdGYW50YXN5JywgJ1JvbWFuY2UnLCAnVHJhdmVsJywgJ0NoaWxkcmVuJywgJ0hvcnJvciddO1xuICAgICRzY29wZS5nZW5yZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbnJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAkc2NvcGUuZ2VucmVzLnB1c2goJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IGdlbnJlc1tpXTtcbiAgICAgICAgfSkpXG4gICAgfVxuICAgIFxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2luZ2xlU3RvcnknLCB7XG4gICAgICAgIHVybDogJy9zdG9yeS86c3RvcnlJZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3Rvcnkvc2luZ2xlLXN0b3J5Lmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2luZ2xlU3RvcnlDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHN0b3J5OiBmdW5jdGlvbihTdG9yeUZhY3RvcnksICRzdGF0ZVBhcmFtcykge1xuICAgICAgICBcdFx0cmV0dXJuIFN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQoJHN0YXRlUGFyYW1zLnN0b3J5SWQpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICBhdXRob3I6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5LCBzdG9yeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEJ5SWQoc3RvcnkudXNlcklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaW5nbGVTdG9yeUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFN0b3J5RmFjdG9yeSwgc3RvcnksIGF1dGhvcikge1xuXHQkc2NvcGUuYXV0aG9yID0gYXV0aG9yO1xuICAgICRzY29wZS5uZXdTdG9yeSA9IHN0b3J5O1xuICAgICRzY29wZS5wYWdlcyA9IHN0b3J5LnBhZ2VzO1xuICAgIGNvbnNvbGUubG9nKCdoZXJlIGlzIHRoZSBzaW5nbGUgc3Rvcnk6ICcsIHN0b3J5KTtcbiAgICB2YXIgdm9pY2UgPSB3aW5kb3cuc3BlZWNoU3ludGhlc2lzO1xuICAgIFxuICAgICRzY29wZS5yZWFkQWxvdWQgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgICAgICAgdm9pY2UuY2FuY2VsKCk7XG4gICAgICAgIHZhciBtc2cgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlKHRleHQpO1xuICAgICAgICB2b2ljZS5zcGVhayhtc2cpO1xuICAgIH1cbn0pOyIsImFwcC5mYWN0b3J5KCdTdG9yeUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHN0b3J5RmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS9zdG9yaWVzL1wiO1xuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaFB1Ymxpc2hlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ2FsbCcpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKGFsbFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBhbGxTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbihzdG9yeUlkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ3N0b3J5LycgKyBzdG9yeUlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0Y29uc29sZS5sb2coc3RvcnkuZGF0YSk7XG5cdFx0XHRyZXR1cm4gc3RvcnkuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoVXNlclN0b3JpZXMgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyAndXNlci8nICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yaWVzKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhzdG9yaWVzLmRhdGEpO1xuXHRcdFx0cmV0dXJuIHN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoYmFzZVVybCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3J5KSB7XG5cdFx0XHRyZXR1cm4gcHVibGlzaGVkU3RvcnkuZGF0YVxuXHRcdH0pXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3J5KSB7XG5cdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZVN0b3J5Jywge3N0b3J5SWQ6IHN0b3J5LmlkfSlcblx0XHR9KVxuXHRcdFxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcblx0XHRyZXR1cm4gJGh0dHAucHV0KGJhc2VVcmwgKyBzdG9yeS5pZCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVwZGF0ZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHVwZGF0ZWRTdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkucmVhZCA9IGZ1bmN0aW9uKHRleHQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCdodHRwOi8vYXBpLnZvaWNlcnNzLm9yZy8/a2V5PTJlNzE0NTE4ZTZiYTQ2ZGQ5YzQ4NzI5MDBlODgyNTVjJmhsPWVuLXVzJnNyYz0nICsgdGV4dClcblx0XHQudGhlbiAoZnVuY3Rpb24gKHNvbmcpIHtcblx0XHRcdHJldHVybiBzb25nLmRhdGE7XG5cdFx0fSlcblx0XHQudGhlbiggZnVuY3Rpb24oc29uZ1RvUGxheSkge1xuXHRcdFx0Y29uc29sZS5sb2coc29uZ1RvUGxheSlcblx0XHRcdFxuXHRcdH0pXG5cdH1cblxuXG5cblx0cmV0dXJuIHN0b3J5RmFjdG9yeTtcblxufSkiLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHVzZXJGYWN0b3J5ID0ge307XG5cdHZhciBiYXNlVXJsID0gXCIvYXBpL3VzZXJzL1wiO1xuXG5cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdHJldHVybiB1c2VyLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHVzZXJGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuXHRcdFx0cmV0dXJuIHVzZXJzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiB1c2VyRmFjdG9yeTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3lvdXJTdG9yaWVzJywge1xuICAgICAgICB1cmw6ICcveW91cnN0b3JpZXMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3lvdXIveW91ci1zdG9yaWVzLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnWW91clN0b3JpZXNDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1lvdXJTdG9yaWVzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgdXNlciwgJHJvb3RTY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSkge1xuXHRcbiAgICBpZiAoJHJvb3RTY29wZS5wYWdlVXBkYXRlKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgJHJvb3RTY29wZS5wYWdlVXBkYXRlID0gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgICRzY29wZS51c2VyID0gdXNlcjtcbiAgICAkc2NvcGUucHVibGlzaGVkU3RvcmllcyA9ICRzY29wZS51c2VyLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIHJldHVybiBzdG9yeS5zdGF0dXMgPT09ICdwdWJsaXNoZWQnO1xuICAgIH0pXG4gICAgJHNjb3BlLnVuZmluaXNoZWRTdG9yaWVzID0gJHNjb3BlLnVzZXIuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHN0b3J5LnN0YXR1cyAhPT0gJ3B1Ymxpc2hlZCc7XG4gICAgfSlcblxuICAgICRzY29wZS5yZXN1bWUgPSBmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAkcm9vdFNjb3BlLnN0b3J5ID0gc3Rvcnk7XG4gICAgfVxufSk7IiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdicm93c2VTdG9yaWVzJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ3JhbmRvR3JlZXRpbmcnLCBmdW5jdGlvbiAoUmFuZG9tR3JlZXRpbmdzKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
