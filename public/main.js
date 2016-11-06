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
    document.body.style.background = "url(background.jpg)";
    document.body.style.backgroundRepeat = "repeat";
    document.body.style.backgroundAttachment = "fixed";
    $scope.author = authorUser;
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
    document.body.style.background = "url(background.jpg)";
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

app.controller('HomeCtrl', function ($scope, users, user, $rootScope, $state, AuthService) {

    $scope.user = user;
    if ($scope.user) {
        document.body.style.background = "url(background.jpg)";
        document.body.style.backgroundRepeat = "repeat";
        document.body.style.backgroundAttachment = "fixed";
    } else {
        document.body.style.background = "url()";
    }

    $scope.createNew = function () {
        $rootScope.story = null;
    };
    $scope.logout = function () {
        AuthService.logout().then(function () {
            $state.go('browseStories');
        });
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
    document.body.style.background = "url(background.jpg)";
    document.body.style.backgroundRepeat = "repeat";
    document.body.style.backgroundAttachment = "fixed";
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
    document.body.style.background = "url(background.jpg)";
    document.body.style.backgroundRepeat = "repeat";
    document.body.style.backgroundAttachment = "fixed";
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
    document.body.style.background = "url(background.jpg)";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFjY291bnQvYWNjb3VudC5qcyIsImF1dGhvci9hdXRob3IuanMiLCJjcmVhdGUvY3JlYXRlLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJncmVldGluZy9ncmVldGluZy5kaXJlY3RpdmUuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lc3NhZ2UvbWVzc2FnZS5kaXJlY3RpdmUuanMiLCJzdG9yeS9icm93c2Uuc3Rvcmllcy5qcyIsInN0b3J5L3NpbmdsZS5zdG9yeS5qcyIsInN0b3J5L3N0b3J5LmZhY3RvcnkuanMiLCJ1c2VyL3VzZXIuZmFjdG9yeS5qcyIsInlvdXIveW91ci5zdG9yaWVzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJ0ZW1wbGF0ZVVybCIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwiY29udHJvbGxlciIsInJlc29sdmUiLCJhdXRob3JVc2VyIiwiVXNlckZhY3RvcnkiLCIkc3RhdGVQYXJhbXMiLCJmZXRjaEJ5SWQiLCJhdXRob3JJZCIsIiRzY29wZSIsImRvY3VtZW50IiwiYm9keSIsInN0eWxlIiwiYmFja2dyb3VuZCIsImJhY2tncm91bmRSZXBlYXQiLCJiYWNrZ3JvdW5kQXR0YWNobWVudCIsImF1dGhvciIsImJyZWFrcG9pbnRzIiwiYnJlYWtwb2ludCIsInNldHRpbmdzIiwic2xpZGVzVG9TaG93Iiwic2xpZGVzVG9TY3JvbGwiLCJpbmZpbml0ZSIsImRvdHMiLCJTdG9yeUZhY3RvcnkiLCJzdWJtaXNzaW9uIiwibWVzc2FnZSIsIm1lc3NhZ2VzIiwic3RvcnkiLCJuZXdTdG9yeSIsInBhZ2VzIiwicG9zIiwibGVuZ3RoIiwidGl0bGUiLCJzdGF0dXMiLCJjb3Zlcl91cmwiLCJnZW5yZSIsInVzZXJJZCIsImltYWdlX3VybCIsImNvbnRlbnQiLCJpZCIsImltYWdlcyIsImkiLCJwdXNoIiwidG9TdHJpbmciLCJnZW5yZXMiLCJ0eXBlIiwiaW1hZ2UiLCJzZWxlY3RHZW5yZSIsImNvbnNvbGUiLCJsb2ciLCJzY3JvbGwiLCJnb0JhY2siLCJuZXh0UGFnZSIsInN1Ym1pdFRpdGxlIiwic3VibWl0UGFnZSIsInNlbGVjdENvdmVyIiwic2VsZWN0UGFnZUltYWdlIiwicHVibGlzaCIsInVwZGF0ZVN0b3J5IiwicHVibGlzaFN0b3J5IiwicGFnZVVwZGF0ZSIsInNhdmVTdG9yeSIsInN1Ym1pdFVybCIsImdldEVsZW1lbnRCeUlkIiwiZm9jdXMiLCJjYW5jZWxTdWJtaXNzaW9uIiwiZGVsZXRlUGFnZSIsInNwbGljZSIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0IiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsIiRpbmplY3RvciIsImdldCIsInNlcnZpY2UiLCIkaHR0cCIsIlNlc3Npb24iLCJvblN1Y2Nlc3NmdWxMb2dpbiIsImNyZWF0ZSIsImZyb21TZXJ2ZXIiLCJjYXRjaCIsImxvZ2luIiwiY3JlZGVudGlhbHMiLCJwb3N0IiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJ1c2VycyIsImZldGNoQWxsIiwiY3JlYXRlTmV3IiwiZXJyb3IiLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJhdXRob3JzIiwiZmlsdGVyIiwic3RvcmllcyIsImZvckVhY2giLCJ3cml0ZXIiLCJzdG9yeUlkIiwiZGVsZXRhYmlsaXR5IiwiZ29vZ2xlX2lkIiwidm9pY2UiLCJzcGVlY2hTeW50aGVzaXMiLCJkZWxldGVTdG9yeSIsImRlbGV0ZSIsImNhbmNlbERlbGV0ZSIsInJlYWRBbG91ZCIsInRleHQiLCJjYW5jZWwiLCJtc2ciLCJTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UiLCJzcGVhayIsInN0b3J5RmFjdG9yeSIsImJhc2VVcmwiLCJmZXRjaFB1Ymxpc2hlZCIsInB1Ymxpc2hlZFN0b3JpZXMiLCJhbGxTdG9yaWVzIiwiZmV0Y2hVc2VyU3RvcmllcyIsInB1Ymxpc2hlZFN0b3J5IiwiZGVsZXRlZFN0b3J5IiwiZGVsZXRlZCIsImN1cnJTdG9yeSIsInVzZXJGYWN0b3J5IiwidW5maW5pc2hlZFN0b3JpZXMiLCJyZXN1bWUiLCJnZXRSYW5kb21Gcm9tQXJyYXkiLCJhcnIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsInNjb3BlIiwibGluayIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNBRix1QkFBQUcsU0FBQSxDQUFBLEdBQUE7QUFDQTtBQUNBSCx1QkFBQUksSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBVCxlQUFBVSxRQUFBLENBQUFDLE1BQUE7QUFDQSxLQUZBO0FBR0EsQ0FUQTs7QUFXQTtBQUNBVixJQUFBVyxHQUFBLENBQUEsVUFBQUMsVUFBQSxFQUFBQyxXQUFBLEVBQUFDLE1BQUEsRUFBQTs7QUFFQTtBQUNBLFFBQUFDLCtCQUFBLFNBQUFBLDRCQUFBLENBQUFDLEtBQUEsRUFBQTtBQUNBLGVBQUFBLE1BQUFDLElBQUEsSUFBQUQsTUFBQUMsSUFBQSxDQUFBQyxZQUFBO0FBQ0EsS0FGQTs7QUFJQTtBQUNBO0FBQ0FOLGVBQUFPLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUFDLEtBQUEsRUFBQUMsT0FBQSxFQUFBQyxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBUCw2QkFBQU0sT0FBQSxDQUFBLEVBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxZQUFBUixZQUFBVSxlQUFBLEVBQUEsRUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0FILGNBQUFJLGNBQUE7O0FBRUFYLG9CQUFBWSxlQUFBLEdBQUFDLElBQUEsQ0FBQSxVQUFBQyxJQUFBLEVBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBQUEsSUFBQSxFQUFBO0FBQ0Fi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Sjs7QUFFQTlLLHVCQUFBTyxHQUFBLENBQUErRixZQUFBUCxZQUFBLEVBQUErRSxPQUFBO0FBQ0E5Syx1QkFBQU8sR0FBQSxDQUFBK0YsWUFBQUwsYUFBQSxFQUFBOEUsVUFBQTtBQUNBL0ssdUJBQUFPLEdBQUEsQ0FBQStGLFlBQUFKLGNBQUEsRUFBQTZFLFVBQUE7QUFFQTs7QUFsQ0EsS0FBQTtBQXNDQSxDQXhDQTs7QUNBQTNMLElBQUE4QixTQUFBLENBQUEsZUFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0FDLGtCQUFBLEdBREE7QUFFQUMscUJBQUE7QUFGQSxLQUFBO0FBSUEsQ0FMQTtBQ0FBaEMsSUFBQThCLFNBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQThKLGVBQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0E3SixrQkFBQSxHQURBO0FBRUFDLHFCQUFBLHlEQUZBO0FBR0F3SixjQUFBLGNBQUFELEtBQUEsRUFBQTtBQUNBQSxrQkFBQU0sUUFBQSxHQUFBRCxnQkFBQU4saUJBQUEsRUFBQTtBQUNBO0FBTEEsS0FBQTtBQVFBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdzbGljayddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnYWNjb3VudCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FjY291bnQvYWNjb3VudC5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRob3InLCB7XG4gICAgICAgIHVybDogJy9hdXRob3IvOmF1dGhvcklkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hdXRob3IvYXV0aG9yLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQXV0aG9yQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JVc2VyOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5hdXRob3JJZCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0F1dGhvckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGF1dGhvclVzZXIpIHtcblx0ZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJ1cmwoYmFja2dyb3VuZC5qcGcpXCI7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gXCJyZXBlYXRcIjtcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRBdHRhY2htZW50ID0gXCJmaXhlZFwiO1xuICAgICRzY29wZS5hdXRob3IgPSBhdXRob3JVc2VyO1xuICAgICRzY29wZS5icmVha3BvaW50cyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGJyZWFrcG9pbnQ6IDEwMjQsXG4gICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMixcbiAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAyLFxuICAgICAgICAgICAgaW5maW5pdGU6IHRydWUsXG4gICAgICAgICAgICBkb3RzOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgYnJlYWtwb2ludDogNzAwLFxuICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDEsXG4gICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMVxuICAgICAgICAgIH1cbiAgICB9XTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY3JlYXRlL2NyZWF0ZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NyZWF0ZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcjogZnVuY3Rpb24oQXV0aFNlcnZpY2UpIHtcbiAgICAgICAgXHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ3JlYXRlQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCAkc3RhdGUsIHVzZXIsICRyb290U2NvcGUpIHtcblx0ZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJ1cmwoYmFja2dyb3VuZC5qcGcpXCI7XG5cdCRzY29wZS51c2VyID0gdXNlcjtcblx0JHNjb3BlLnN1Ym1pc3Npb24gPSB7fTtcblx0JHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuXHQkc2NvcGUubWVzc2FnZXMgPSBbXCJzZWxlY3QgYSBnZW5yZSBmb3IgeW91ciBuZXcgc3RvcnlcIiwgXCJkZXNpZ24gdGhlIGNvdmVyIG9mIHlvdXIgc3RvcnlcIiwgXCJkZXNpZ24geW91ciBib29rJ3MgcGFnZXNcIiwgXCJQbGVhc2Ugd2FpdCB3aGlsZSB5b3VyIGJvb2sgaXMgcHVibGlzaGVkLlwiLCBcIlBsZWFzZSB3YWl0IHdoaWxlIHlvdXIgYm9vayBpcyBzYXZlZC5cIiwgJ0VudGVyIHRoZSBVUkwgb2YgdGhlIHBpY3R1cmUgdGhhdCB5b3Ugd291bGQgbGlrZSB0byB1c2UuJ11cblx0aWYgKCRyb290U2NvcGUuc3RvcnkpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkgPSAkcm9vdFNjb3BlLnN0b3J5O1xuXHRcdCRzY29wZS5wYWdlcyA9ICRzY29wZS5uZXdTdG9yeS5wYWdlcztcblx0XHQkc2NvcGUucG9zID0gJHNjb3BlLnBhZ2VzLmxlbmd0aCArIDE7XG5cdH0gZWxzZSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5ID0ge1xuXHRcdFx0dGl0bGU6IFwiTXkgTmV3IFN0b3J5XCIsXG5cdFx0XHRzdGF0dXM6IFwiaW5jb21wbGV0ZVwiLFxuXHRcdFx0Y292ZXJfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRnZW5yZTogXCJub25lXCIsXG5cdFx0XHR1c2VySWQ6IDEsXG5cdFx0XHRwYWdlczogbnVsbFxuXHRcdH1cblx0XHQkc2NvcGUucGFnZXMgPSBbXG5cdFx0XHR7XG5cdFx0XHRcdGltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLFxuXHRcdFx0XHRjb250ZW50OiBcIlwiXG5cdFx0XHR9XG5cdFx0XTtcblx0XHQkc2NvcGUucG9zID0gMDtcblx0fVxuXHRcblx0JHNjb3BlLmF1dGhvciA9IFwiYW5vbnltb3VzXCJcblx0aWYgKHVzZXIpIHtcblx0XHQkc2NvcGUuYXV0aG9yID0gdXNlci5uYW1lO1xuXHRcdCRzY29wZS5uZXdTdG9yeS51c2VySWQgPSB1c2VyLmlkOyBcblx0fVxuXHRcblx0JHNjb3BlLmltYWdlcyA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IDI2NzsgaSsrKSB7XG5cblx0XHQkc2NvcGUuaW1hZ2VzLnB1c2goaS50b1N0cmluZygpICsgJy5wbmcnKTtcblx0fVxuXHRcblxuXHRcblxuXHQkc2NvcGUuZ2VucmVzID0gW1xuXHRcdHtcblx0XHRcdHR5cGU6ICdTY2llbmNlIEZpY3Rpb24nLFxuXHRcdFx0aW1hZ2U6ICdzY2llbmNlLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdSZWFsaXN0aWMgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3JlYWxpc3RpYy1maWN0aW9uLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnTm9uZmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ25vbmZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdGYW50YXN5Jyxcblx0XHRcdGltYWdlOiAnZmFudGFzeS5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JvbWFuY2UnLFxuXHRcdFx0aW1hZ2U6ICdyb21hbmNlLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnVHJhdmVsJyxcblx0XHRcdGltYWdlOiAndHJhdmVsLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnQ2hpbGRyZW4nLFxuXHRcdFx0aW1hZ2U6ICdjaGlsZHJlbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0hvcnJvcicsXG5cdFx0XHRpbWFnZTogJ2FkdWx0LmpwZycsXG5cdFx0fVxuXHRdO1xuXG5cdCRzY29wZS5zZWxlY3RHZW5yZSA9IGZ1bmN0aW9uKGdlbnJlKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmdlbnJlID0gZ2VucmU7XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLm5ld1N0b3J5LmdlbnJlKTtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5nb0JhY2sgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zIC0tO1xuXHR9XG5cdCRzY29wZS5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0VGl0bGUgPSBmdW5jdGlvbigpIHtcblx0XHQkc2NvcGUucG9zICsrO1xuXHRcdHdpbmRvdy5zY3JvbGwoMCwwKTtcblx0fVxuXG5cdCRzY29wZS5zdWJtaXRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnB1c2goe2ltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLCBjb250ZW50OiAnJ30pO1xuXHRcdCRzY29wZS5wb3MgPSAkc2NvcGUucGFnZXMubGVuZ3RoICsgMTtcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSBmdW5jdGlvbih1cmwpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuY292ZXJfdXJsID0gdXJsO1xuXHR9XG5cblx0JHNjb3BlLnNlbGVjdFBhZ2VJbWFnZSA9IGZ1bmN0aW9uKHVybCkge1xuXHRcdCRzY29wZS5wYWdlc1skc2NvcGUucG9zLTJdLmltYWdlX3VybCA9IHVybDtcblx0fVxuXG5cdCRzY29wZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCEkc2NvcGUubWVzc2FnZSkge1xuXHRcdFx0JHNjb3BlLm1lc3NhZ2UgPSAkc2NvcGUubWVzc2FnZXNbM107XG5cdFx0XHQkc2NvcGUubmV3U3Rvcnkuc3RhdHVzID0gXCJwdWJsaXNoZWRcIjtcblx0XHRcdCRzY29wZS5uZXdTdG9yeS5wYWdlcyA9ICRzY29wZS5wYWdlcztcblx0XHRcdGlmICgkc2NvcGUubmV3U3RvcnkuaWQpIHtcblx0XHRcdFx0U3RvcnlGYWN0b3J5LnVwZGF0ZVN0b3J5KCRzY29wZS5uZXdTdG9yeSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KTtcblx0XHRcdH1cblx0XHRcdCRyb290U2NvcGUucGFnZVVwZGF0ZSA9IHRydWU7XG5cdFx0fVxuXHR9XG5cblx0JHNjb3BlLnNhdmVTdG9yeSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICghJHNjb3BlLm1lc3NhZ2UpIHtcblx0XHRcdCRzY29wZS5tZXNzYWdlID0gJHNjb3BlLm1lc3NhZ2VzWzRdO1xuXHRcdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdFx0aWYgKCRzY29wZS5uZXdTdG9yeS5pZCkge1xuXHRcdFx0XHRTdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkoJHNjb3BlLm5ld1N0b3J5KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgkc2NvcGUubmV3U3RvcnkpO1xuXHRcdFx0fVxuXHRcdFx0JHJvb3RTY29wZS5wYWdlVXBkYXRlID0gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHQkc2NvcGUuc3VibWl0VXJsID0gZnVuY3Rpb24oKSB7XG5cblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImlucHV0X3RleHRcIikuZm9jdXMoKTtcblx0XHQkc2NvcGUubWVzc2FnZSA9ICRzY29wZS5tZXNzYWdlc1s1XTtcblx0XHQkc2NvcGUuc3VibWlzc2lvbi5pbWFnZSA9IFwiXCI7XG5cdFx0d2luZG93LnNjcm9sbCgwLCAwKTtcblx0fVxuXHQkc2NvcGUuY2FuY2VsU3VibWlzc2lvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5tZXNzYWdlID0gbnVsbDtcblx0fVxuXG5cdCRzY29wZS5kZWxldGVQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnNwbGljZSgkc2NvcGUucG9zLTIsIDEpO1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JlZXRpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ncmVldGluZy9ncmVldGluZy5odG1sJ1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyczogZnVuY3Rpb24oVXNlckZhY3RvcnkpIHtcbiAgICAgICAgXHRcdHJldHVybiBVc2VyRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICBcdH0sXG4gICAgICAgICAgICB1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdIb21lQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgdXNlcnMsIHVzZXIsICRyb290U2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UpIHtcbiAgICBcbiAgICAkc2NvcGUudXNlciA9IHVzZXI7XG4gICAgaWYgKCRzY29wZS51c2VyKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuYmFja2dyb3VuZCA9IFwidXJsKGJhY2tncm91bmQuanBnKVwiO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSBcInJlcGVhdFwiO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRBdHRhY2htZW50ID0gXCJmaXhlZFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuYmFja2dyb3VuZCA9IFwidXJsKClcIjtcbiAgICB9XG5cbiAgICAkc2NvcGUuY3JlYXRlTmV3ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRyb290U2NvcGUuc3RvcnkgPSBudWxsO1xuICAgIH1cbiAgICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdicm93c2VTdG9yaWVzJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ21lc3NhZ2VQcm9tcHQnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9tZXNzYWdlL21lc3NhZ2UuaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYnJvd3NlU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2Jyb3dzZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3RvcnkvYnJvd3NlLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdCcm93c2VTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Jyb3dzZVN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3JzKSB7XG5cdGRvY3VtZW50LmJvZHkuc3R5bGUuYmFja2dyb3VuZCA9IFwidXJsKGJhY2tncm91bmQuanBnKVwiO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuYmFja2dyb3VuZFJlcGVhdCA9IFwicmVwZWF0XCI7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kQXR0YWNobWVudCA9IFwiZml4ZWRcIjtcbiAgICAkc2NvcGUuYXV0aG9ycyA9IGF1dGhvcnMuZmlsdGVyKGZ1bmN0aW9uKGF1dGhvcikge1xuICAgICAgICByZXR1cm4gYXV0aG9yLnN0b3JpZXMubGVuZ3RoO1xuICAgIH0pXG4gICAgJHNjb3BlLmJyZWFrcG9pbnRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgYnJlYWtwb2ludDogMTAyNCxcbiAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAyLFxuICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDIsXG4gICAgICAgICAgICBpbmZpbml0ZTogdHJ1ZSxcbiAgICAgICAgICAgIGRvdHM6IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBicmVha3BvaW50OiA3MDAsXG4gICAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIHNsaWRlc1RvU2hvdzogMSxcbiAgICAgICAgICAgIHNsaWRlc1RvU2Nyb2xsOiAxXG4gICAgICAgICAgfVxuICAgIH1dO1xuICAgICRzY29wZS5zdG9yaWVzID0gW107XG4gICAgJHNjb3BlLmF1dGhvcnMuZm9yRWFjaChmdW5jdGlvbih3cml0ZXIpIHtcbiAgICAgICAgd3JpdGVyLnN0b3JpZXMuZm9yRWFjaChmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICAgICAgc3RvcnkuYXV0aG9yID0gd3JpdGVyLm5hbWU7XG4gICAgICAgICAgICBzdG9yeS5hdXRob3JJZCA9IHdyaXRlci5pZDtcbiAgICAgICAgICAgIGlmIChzdG9yeS5zdGF0dXMgPT09ICdwdWJsaXNoZWQnKSB7XG4gICAgICAgICAgICAgICAkc2NvcGUuc3Rvcmllcy5wdXNoKHN0b3J5KTsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIFxuICAgIHZhciBnZW5yZXMgPSBbJ1NjaWVuY2UgRmljdGlvbicsICdSZWFsaXN0aWMgRmljdGlvbicsICdOb25maWN0aW9uJywgJ0ZhbnRhc3knLCAnUm9tYW5jZScsICdUcmF2ZWwnLCAnQ2hpbGRyZW4nLCAnSG9ycm9yJ107XG4gICAgJHNjb3BlLmdlbnJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VucmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICRzY29wZS5nZW5yZXMucHVzaCgkc2NvcGUuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdG9yeS5nZW5yZSA9PT0gZ2VucmVzW2ldO1xuICAgICAgICB9KSlcbiAgICB9XG4gICAgXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVTdG9yeScsIHtcbiAgICAgICAgdXJsOiAnL3N0b3J5LzpzdG9yeUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zdG9yeS9zaW5nbGUtc3RvcnkuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaW5nbGVTdG9yeUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0c3Rvcnk6IGZ1bmN0aW9uKFN0b3J5RmFjdG9yeSwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIFx0XHRyZXR1cm4gU3RvcnlGYWN0b3J5LmZldGNoQnlJZCgkc3RhdGVQYXJhbXMuc3RvcnlJZCk7XG4gICAgICAgIFx0fSxcbiAgICAgICAgICAgIGF1dGhvcjogZnVuY3Rpb24oVXNlckZhY3RvcnksIHN0b3J5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQnlJZChzdG9yeS51c2VySWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZXI6IGZ1bmN0aW9uKEF1dGhTZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpbmdsZVN0b3J5Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgU3RvcnlGYWN0b3J5LCBzdG9yeSwgYXV0aG9yLCB1c2VyLCAkcm9vdFNjb3BlKSB7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJ1cmwoYmFja2dyb3VuZC5qcGcpXCI7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kUmVwZWF0ID0gXCJyZXBlYXRcIjtcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmRBdHRhY2htZW50ID0gXCJmaXhlZFwiO1xuICAgICRzY29wZS5hdXRob3IgPSBhdXRob3I7XG4gICAgJHNjb3BlLm5ld1N0b3J5ID0gc3Rvcnk7XG4gICAgJHNjb3BlLnBhZ2VzID0gc3RvcnkucGFnZXM7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBudWxsO1xuICAgICRzY29wZS5kZWxldGFiaWxpdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHVzZXIuaWQgPT09IGF1dGhvci5pZCB8fCB1c2VyLmdvb2dsZV9pZCA9PT0gXCIxMDU2OTA1Mzc2Nzk5NzQ3ODcwMDFcIikge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgXG4gICAgfVxuICAgIHZhciB2b2ljZSA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgXG4gICAgJHNjb3BlLmRlbGV0ZVN0b3J5ID0gZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgd2luZG93LnNjcm9sbCgwLCAwKTtcbiAgICAgICAgaWYgKCRzY29wZS5tZXNzYWdlICE9PSBcIkRlbGV0aW5nIGJvb2suLi5cIikge1xuICAgICAgICAgICAgaWYgKCEkc2NvcGUubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5tZXNzYWdlID0gXCJBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgYm9vaz9cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm1lc3NhZ2UgPSBcIkRlbGV0aW5nIGJvb2suLi5cIjtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLnBhZ2VVcGRhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIFN0b3J5RmFjdG9yeS5kZWxldGUoc3RvcnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IFxuICAgIH1cbiAgICAkc2NvcGUuY2FuY2VsRGVsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5tZXNzYWdlID0gbnVsbDtcbiAgICB9XG4gICAgJHNjb3BlLnJlYWRBbG91ZCA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICAgICAgICB2b2ljZS5jYW5jZWwoKTtcbiAgICAgICAgdmFyIG1zZyA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UodGV4dCk7XG4gICAgICAgIHZvaWNlLnNwZWFrKG1zZyk7XG4gICAgfVxuXG59KTsiLCJhcHAuZmFjdG9yeSgnU3RvcnlGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciBzdG9yeUZhY3RvcnkgPSB7fTtcblx0dmFyIGJhc2VVcmwgPSBcIi9hcGkvc3Rvcmllcy9cIjtcblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hQdWJsaXNoZWQgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KGJhc2VVcmwpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBwdWJsaXNoZWRTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdhbGwnKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChhbGxTdG9yaWVzKSB7XG5cdFx0XHRyZXR1cm4gYWxsU3Rvcmllcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24oc3RvcnlJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICdzdG9yeS8nICsgc3RvcnlJZClcblx0XHQudGhlbihmdW5jdGlvbiAoc3RvcnkpIHtcblx0XHRcdHJldHVybiBzdG9yeS5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkuZmV0Y2hVc2VyU3RvcmllcyA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybCArICd1c2VyLycgKyB1c2VySWQpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBzdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KGJhc2VVcmwsIHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChwdWJsaXNoZWRTdG9yeSkge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3J5LmRhdGFcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0JHN0YXRlLmdvKCdzaW5nbGVTdG9yeScsIHtzdG9yeUlkOiBzdG9yeS5pZH0pXG5cdFx0fSlcblx0XHRcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5kZWxldGUgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHJldHVybiAkaHR0cC5kZWxldGUoYmFzZVVybCArIHN0b3J5LmlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChkZWxldGVkU3RvcnkpIHtcblx0XHRcdHJldHVybiBkZWxldGVkU3RvcnkuZGF0YTtcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uKGRlbGV0ZWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdH0pXG5cdH1cblxuXHRzdG9yeUZhY3RvcnkudXBkYXRlU3RvcnkgPSBmdW5jdGlvbihzdG9yeSkge1xuXHRcdHZhciBjdXJyU3RvcnkgPSB0aGlzO1xuXHRcdGN1cnJTdG9yeS5kZWxldGUoc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY3VyclN0b3J5LnB1Ymxpc2hTdG9yeShzdG9yeSk7XG5cdFx0fSlcblx0fVxuXG5cdHJldHVybiBzdG9yeUZhY3Rvcnk7XG5cbn0pIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciB1c2VyRmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS91c2Vycy9cIjtcblxuXG5cblx0dXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gdXNlci5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcblx0XHRcdHJldHVybiB1c2Vycy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gdXNlckZhY3Rvcnk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd5b3VyU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL3lvdXJzdG9yaWVzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy95b3VyL3lvdXItc3Rvcmllcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1lvdXJTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHR1c2VyOiBmdW5jdGlvbihBdXRoU2VydmljZSkge1xuICAgICAgICBcdFx0cmV0dXJuIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdZb3VyU3Rvcmllc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHVzZXIsICRyb290U2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UpIHtcblx0ZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJ1cmwoYmFja2dyb3VuZC5qcGcpXCI7XG4gICAgaWYgKCRyb290U2NvcGUucGFnZVVwZGF0ZSkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICRyb290U2NvcGUucGFnZVVwZGF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICAkc2NvcGUuYnJlYWtwb2ludHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBicmVha3BvaW50OiAxMDI0LFxuICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICBzbGlkZXNUb1Nob3c6IDIsXG4gICAgICAgICAgICBzbGlkZXNUb1Njcm9sbDogMixcbiAgICAgICAgICAgIGluZmluaXRlOiB0cnVlLFxuICAgICAgICAgICAgZG90czogdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGJyZWFrcG9pbnQ6IDcwMCxcbiAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgc2xpZGVzVG9TaG93OiAxLFxuICAgICAgICAgICAgc2xpZGVzVG9TY3JvbGw6IDFcbiAgICAgICAgICB9XG4gICAgfV07XG4gICAgXG4gICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICRzY29wZS5wdWJsaXNoZWRTdG9yaWVzID0gJHNjb3BlLnVzZXIuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHN0b3J5LnN0YXR1cyA9PT0gJ3B1Ymxpc2hlZCc7XG4gICAgfSlcbiAgICAkc2NvcGUudW5maW5pc2hlZFN0b3JpZXMgPSAkc2NvcGUudXNlci5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICByZXR1cm4gc3Rvcnkuc3RhdHVzICE9PSAncHVibGlzaGVkJztcbiAgICB9KVxuXG4gICAgJHNjb3BlLnJlc3VtZSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICRyb290U2NvcGUuc3RvcnkgPSBzdG9yeTtcbiAgICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYnJvd3NlU3RvcmllcycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
