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
    $stateProvider.state('create', {
        url: '/create',
        templateUrl: 'js/create/create.html',
        controller: 'CreateCtrl'
    });
});

app.controller('CreateCtrl', function ($scope, StoryFactory, $state) {
    $scope.messages = ["select a genre for your new story", "design the cover of your story book", "design your book's pages"];
    $scope.newStory = {
        title: "My New Story",
        status: "incomplete",
        cover_url: "not-available.jpg",
        genre: "none",
        userId: 1,
        pages: null
    };
    $scope.pos = 0;
    $scope.author = "anonymous";
    $scope.images = [];
    for (var i = 0; i < 94; i++) {

        $scope.images.push(i.toString() + '.png');
    }

    $scope.pages = [{
        image_url: "not-available.jpg",
        content: ""
    }];

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
        StoryFactory.publishStory($scope.newStory);
    };
    // $scope.publish = function() {
    // 	StoryFactory.publishStory()
    // 	.then(function(publishedStory) {
    // 		if (publishedStory) {
    // 			$state.go('story', {storyId: publishedStory.id })
    // 		}

    // 	});
    // }

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

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeCtrl',
        resolve: {
            users: function users(UserFactory) {
                return UserFactory.fetchAll();
            }
        }
    });
});

app.controller('HomeCtrl', function ($scope, users, $interval) {
    console.log(users);
});
app.directive('greeting', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/greeting/greeting.html'
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
            $scope.stories.push(story);
        });
    });

    var genres = ['Science Fiction', 'Realistic Fiction', 'Nonfiction', 'Fantasy', 'Romance', 'Travel', 'Children', 'Horror'];
    $scope.genres = [];
    for (var i = 0; i < genres.length; i++) {
        $scope.genres.push($scope.stories.filter(function (story) {
            return story.genre === genres[i];
        }));
    }
    // $scope.scienceFiction = $scope.stories.filter(function(story) {
    //     return story.genre === "Science Fiction";
    // })
    // $scope.realisticFiction = $scope.stories.filter(function(story) {
    //     return story.genre === "Realistic Fiction";
    // })
    // $scope.nonfiction = $scope.stories.filter(function(story) {
    //     return story.genre === "Nonfiction";
    // })
    // $scope.fantasy = $scope.stories.filter(function(story) {
    //     return story.genre === "Fantasy";
    // })
    // $scope.romance = $scope.stories.filter(function(story) {
    //     return story.genre === "Romance";
    // })
    // $scope.travel = $scope.stories.filter(function(story) {
    //     return story.genre === "Travel";
    // })
    // $scope.children = $scope.stories.filter(function(story) {
    //     return story.genre === "Children";
    // })
    // $scope.horror = $scope.stories.filter(function(story) {
    //     return story.genre === "Horror";
    // })
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
    $scope.author = author.name;
    $scope.newStory = story;
    $scope.pages = story.pages;
    console.log('here is the single story: ', story);
    var voice = null;
    $scope.readAloud = function (text) {
        voice = null;

        var msg = new SpeechSynthesisUtterance(text);
        var voices = window.speechSynthesis.getVoices();
        console.log(voices);
        msg.voice = voices.filter(function (el) {
            return el.name === 'Cellos';
        })[0];
        console.log(msg);
        window.speechSynthesis.speak(msg);
        // voice = VoiceRSS.speech({
        //     key: '2e714518e6ba46dd9c4872900e88255c',
        //     src: text,
        //     hl: 'en-gb',
        //     r: 0, 
        //     c: 'mp3',
        //     f: '44khz_16bit_stereo',
        //     ssml: false
        // });
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

    storyFactory.publishStory = function (story) {
        return $http.post(baseUrl, story).then(function (publishedStory) {
            // console.log('here it is: ', publishedStory)

            return publishedStory.data;
        }).then(function (story) {
            console.log(story);
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
                    $state.go('home');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNyZWF0ZS9jcmVhdGUuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImdyZWV0aW5nL2dyZWV0aW5nLmpzIiwibG9naW4vbG9naW4uanMiLCJzdG9yeS9icm93c2Uuc3Rvcmllcy5qcyIsInN0b3J5L3NpbmdsZS5zdG9yeS5qcyIsInN0b3J5L3N0b3J5LmZhY3RvcnkuanMiLCJ1c2VyL3VzZXIuZmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiXSwibmFtZXMiOlsid2luZG93IiwiYXBwIiwiYW5ndWxhciIsIm1vZHVsZSIsImNvbmZpZyIsIiR1cmxSb3V0ZXJQcm92aWRlciIsIiRsb2NhdGlvblByb3ZpZGVyIiwiaHRtbDVNb2RlIiwib3RoZXJ3aXNlIiwid2hlbiIsImxvY2F0aW9uIiwicmVsb2FkIiwicnVuIiwiJHJvb3RTY29wZSIsIkF1dGhTZXJ2aWNlIiwiJHN0YXRlIiwiZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCIsInN0YXRlIiwiZGF0YSIsImF1dGhlbnRpY2F0ZSIsIiRvbiIsImV2ZW50IiwidG9TdGF0ZSIsInRvUGFyYW1zIiwiaXNBdXRoZW50aWNhdGVkIiwicHJldmVudERlZmF1bHQiLCJnZXRMb2dnZWRJblVzZXIiLCJ0aGVuIiwidXNlciIsImdvIiwibmFtZSIsIiRzdGF0ZVByb3ZpZGVyIiwidXJsIiwidGVtcGxhdGVVcmwiLCJjb250cm9sbGVyIiwiJHNjb3BlIiwiU3RvcnlGYWN0b3J5IiwibWVzc2FnZXMiLCJuZXdTdG9yeSIsInRpdGxlIiwic3RhdHVzIiwiY292ZXJfdXJsIiwiZ2VucmUiLCJ1c2VySWQiLCJwYWdlcyIsInBvcyIsImF1dGhvciIsImltYWdlcyIsImkiLCJwdXNoIiwidG9TdHJpbmciLCJpbWFnZV91cmwiLCJjb250ZW50IiwiZ2VucmVzIiwidHlwZSIsImltYWdlIiwic2VsZWN0R2VucmUiLCJjb25zb2xlIiwibG9nIiwic2Nyb2xsIiwiZ29CYWNrIiwibmV4dFBhZ2UiLCJzdWJtaXRUaXRsZSIsInN1Ym1pdFBhZ2UiLCJsZW5ndGgiLCJzZWxlY3RDb3ZlciIsInNlbGVjdFBhZ2VJbWFnZSIsInB1Ymxpc2giLCJwdWJsaXNoU3RvcnkiLCJkZWxldGVQYWdlIiwic3BsaWNlIiwiRXJyb3IiLCJmYWN0b3J5IiwiaW8iLCJvcmlnaW4iLCJjb25zdGFudCIsImxvZ2luU3VjY2VzcyIsImxvZ2luRmFpbGVkIiwibG9nb3V0U3VjY2VzcyIsInNlc3Npb25UaW1lb3V0Iiwibm90QXV0aGVudGljYXRlZCIsIm5vdEF1dGhvcml6ZWQiLCIkcSIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCJyZXNwb25zZSIsIiRicm9hZGNhc3QiLCJyZWplY3QiLCIkaHR0cFByb3ZpZGVyIiwiaW50ZXJjZXB0b3JzIiwiJGluamVjdG9yIiwiZ2V0Iiwic2VydmljZSIsIiRodHRwIiwiU2Vzc2lvbiIsIm9uU3VjY2Vzc2Z1bExvZ2luIiwiY3JlYXRlIiwiaWQiLCJmcm9tU2VydmVyIiwiY2F0Y2giLCJsb2dpbiIsImNyZWRlbnRpYWxzIiwicG9zdCIsIm1lc3NhZ2UiLCJsb2dvdXQiLCJkZXN0cm95Iiwic2VsZiIsInNlc3Npb25JZCIsInJlc29sdmUiLCJ1c2VycyIsIlVzZXJGYWN0b3J5IiwiZmV0Y2hBbGwiLCIkaW50ZXJ2YWwiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsImVycm9yIiwic2VuZExvZ2luIiwibG9naW5JbmZvIiwiYXV0aG9ycyIsImZpbHRlciIsInN0b3JpZXMiLCJmb3JFYWNoIiwid3JpdGVyIiwic3RvcnkiLCIkc3RhdGVQYXJhbXMiLCJmZXRjaEJ5SWQiLCJzdG9yeUlkIiwidm9pY2UiLCJyZWFkQWxvdWQiLCJ0ZXh0IiwibXNnIiwiU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIiwidm9pY2VzIiwic3BlZWNoU3ludGhlc2lzIiwiZ2V0Vm9pY2VzIiwiZWwiLCJzcGVhayIsInN0b3J5RmFjdG9yeSIsImJhc2VVcmwiLCJmZXRjaFB1Ymxpc2hlZCIsInB1Ymxpc2hlZFN0b3JpZXMiLCJhbGxTdG9yaWVzIiwicHVibGlzaGVkU3RvcnkiLCJ1cGRhdGVTdG9yeSIsInB1dCIsInVwZGF0ZWRTdG9yeSIsInJlYWQiLCJzb25nIiwic29uZ1RvUGxheSIsInVzZXJGYWN0b3J5IiwiZ2V0UmFuZG9tRnJvbUFycmF5IiwiYXJyIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiZ3JlZXRpbmdzIiwiZ2V0UmFuZG9tR3JlZXRpbmciLCJzY29wZSIsImxpbmsiLCJpc0xvZ2dlZEluIiwic2V0VXNlciIsInJlbW92ZVVzZXIiLCJSYW5kb21HcmVldGluZ3MiLCJncmVldGluZyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0FBLE9BQUFDLEdBQUEsR0FBQUMsUUFBQUMsTUFBQSxDQUFBLHVCQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7O0FBRUFGLElBQUFHLE1BQUEsQ0FBQSxVQUFBQyxrQkFBQSxFQUFBQyxpQkFBQSxFQUFBO0FBQ0E7QUFDQUEsc0JBQUFDLFNBQUEsQ0FBQSxJQUFBO0FBQ0E7QUFDQUYsdUJBQUFHLFNBQUEsQ0FBQSxHQUFBO0FBQ0E7QUFDQUgsdUJBQUFJLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQVQsZUFBQVUsUUFBQSxDQUFBQyxNQUFBO0FBQ0EsS0FGQTtBQUdBLENBVEE7O0FBV0E7QUFDQVYsSUFBQVcsR0FBQSxDQUFBLFVBQUFDLFVBQUEsRUFBQUMsV0FBQSxFQUFBQyxNQUFBLEVB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QSxHQUFBQSxJQUFBO0FBQ0EsaUJBRkE7QUFHQSxhQUpBOztBQU1BLGdCQUFBc0ksYUFBQSxTQUFBQSxVQUFBLEdBQUE7QUFDQUosc0JBQUFsSSxJQUFBLEdBQUEsSUFBQTtBQUNBLGFBRkE7O0FBSUFxSTs7QUFFQXBKLHVCQUFBTyxHQUFBLENBQUErRCxZQUFBUCxZQUFBLEVBQUFxRixPQUFBO0FBQ0FwSix1QkFBQU8sR0FBQSxDQUFBK0QsWUFBQUwsYUFBQSxFQUFBb0YsVUFBQTtBQUNBckosdUJBQUFPLEdBQUEsQ0FBQStELFlBQUFKLGNBQUEsRUFBQW1GLFVBQUE7QUFFQTs7QUFsQ0EsS0FBQTtBQXNDQSxDQXhDQTs7QUNBQWpLLElBQUFpSCxTQUFBLENBQUEsZUFBQSxFQUFBLFVBQUFpRCxlQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBaEQsa0JBQUEsR0FEQTtBQUVBbEYscUJBQUEseURBRkE7QUFHQThILGNBQUEsY0FBQUQsS0FBQSxFQUFBO0FBQ0FBLGtCQUFBTSxRQUFBLEdBQUFELGdCQUFBTixpQkFBQSxFQUFBO0FBQ0E7QUFMQSxLQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ3NsaWNrJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjcmVhdGUnLCB7XG4gICAgICAgIHVybDogJy9jcmVhdGUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NyZWF0ZS9jcmVhdGUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDcmVhdGVDdHJsJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDcmVhdGVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBTdG9yeUZhY3RvcnksICRzdGF0ZSkge1xuXHQkc2NvcGUubWVzc2FnZXMgPSBbXCJzZWxlY3QgYSBnZW5yZSBmb3IgeW91ciBuZXcgc3RvcnlcIiwgXCJkZXNpZ24gdGhlIGNvdmVyIG9mIHlvdXIgc3RvcnkgYm9va1wiLCBcImRlc2lnbiB5b3VyIGJvb2sncyBwYWdlc1wiXVxuXHQkc2NvcGUubmV3U3RvcnkgPSB7XG5cdFx0dGl0bGU6IFwiTXkgTmV3IFN0b3J5XCIsXG5cdFx0c3RhdHVzOiBcImluY29tcGxldGVcIixcblx0XHRjb3Zlcl91cmw6IFwibm90LWF2YWlsYWJsZS5qcGdcIixcblx0XHRnZW5yZTogXCJub25lXCIsXG5cdFx0dXNlcklkOiAxLFxuXHRcdHBhZ2VzOiBudWxsXG5cdH1cblx0JHNjb3BlLnBvcyA9IDA7XG5cdCRzY29wZS5hdXRob3IgPSBcImFub255bW91c1wiXG5cdCRzY29wZS5pbWFnZXMgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCA5NDsgaSsrKSB7XG5cblx0XHQkc2NvcGUuaW1hZ2VzLnB1c2goaS50b1N0cmluZygpICsgJy5wbmcnKTtcblx0fVxuXHRcblxuXHQkc2NvcGUucGFnZXMgPSBbXG5cdFx0e1xuXHRcdFx0aW1hZ2VfdXJsOiBcIm5vdC1hdmFpbGFibGUuanBnXCIsXG5cdFx0XHRjb250ZW50OiBcIlwiXG5cdFx0fVxuXHRdO1xuXG5cdCRzY29wZS5nZW5yZXMgPSBbXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1NjaWVuY2UgRmljdGlvbicsXG5cdFx0XHRpbWFnZTogJ3NjaWVuY2UtZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ1JlYWxpc3RpYyBGaWN0aW9uJyxcblx0XHRcdGltYWdlOiAncmVhbGlzdGljLWZpY3Rpb24uanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdOb25maWN0aW9uJyxcblx0XHRcdGltYWdlOiAnbm9uZmljdGlvbi5qcGcnLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dHlwZTogJ0ZhbnRhc3knLFxuXHRcdFx0aW1hZ2U6ICdmYW50YXN5LmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnUm9tYW5jZScsXG5cdFx0XHRpbWFnZTogJ3JvbWFuY2UuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdUcmF2ZWwnLFxuXHRcdFx0aW1hZ2U6ICd0cmF2ZWwuanBnJyxcblx0XHR9LFxuXHRcdHtcblx0XHRcdHR5cGU6ICdDaGlsZHJlbicsXG5cdFx0XHRpbWFnZTogJ2NoaWxkcmVuLmpwZycsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHR0eXBlOiAnSG9ycm9yJyxcblx0XHRcdGltYWdlOiAnYWR1bHQuanBnJyxcblx0XHR9XG5cdF07XG5cblx0JHNjb3BlLnNlbGVjdEdlbnJlID0gZnVuY3Rpb24oZ2VucmUpIHtcblx0XHQkc2NvcGUubmV3U3RvcnkuZ2VucmUgPSBnZW5yZTtcblx0XHRjb25zb2xlLmxvZygkc2NvcGUubmV3U3RvcnkuZ2VucmUpO1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cblx0JHNjb3BlLmdvQmFjayA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cblx0JHNjb3BlLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBvcyArKztcblx0fVxuXG5cdCRzY29wZS5zdWJtaXRUaXRsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdCRzY29wZS5wb3MgKys7XG5cdFx0d2luZG93LnNjcm9sbCgwLDApO1xuXHR9XG5cdCRzY29wZS5zdWJtaXRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnB1c2goe2ltYWdlX3VybDogXCJub3QtYXZhaWxhYmxlLmpwZ1wiLCBjb250ZW50OiAnJ30pO1xuXHRcdCRzY29wZS5wb3MgPSAkc2NvcGUucGFnZXMubGVuZ3RoICsgMTtcblx0XHR3aW5kb3cuc2Nyb2xsKDAsMCk7XG5cdH1cblx0JHNjb3BlLnNlbGVjdENvdmVyID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LmNvdmVyX3VybCA9IHVybDtcblx0fVxuXHQkc2NvcGUuc2VsZWN0UGFnZUltYWdlID0gZnVuY3Rpb24odXJsKSB7XG5cdFx0JHNjb3BlLnBhZ2VzWyRzY29wZS5wb3MtMl0uaW1hZ2VfdXJsID0gdXJsO1xuXHR9XG5cdCRzY29wZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnN0YXR1cyA9IFwicHVibGlzaGVkXCI7XG5cdFx0JHNjb3BlLm5ld1N0b3J5LnBhZ2VzID0gJHNjb3BlLnBhZ2VzO1xuXHRcdFN0b3J5RmFjdG9yeS5wdWJsaXNoU3RvcnkoJHNjb3BlLm5ld1N0b3J5KVxuXHR9XG5cdC8vICRzY29wZS5wdWJsaXNoID0gZnVuY3Rpb24oKSB7XG5cdC8vIFx0U3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSgpXG5cdC8vIFx0LnRoZW4oZnVuY3Rpb24ocHVibGlzaGVkU3RvcnkpIHtcblx0Ly8gXHRcdGlmIChwdWJsaXNoZWRTdG9yeSkge1xuXHQvLyBcdFx0XHQkc3RhdGUuZ28oJ3N0b3J5Jywge3N0b3J5SWQ6IHB1Ymxpc2hlZFN0b3J5LmlkIH0pXG5cdC8vIFx0XHR9XG5cdFx0XHRcblx0Ly8gXHR9KTtcblx0Ly8gfVxuXG5cdCRzY29wZS5kZWxldGVQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0JHNjb3BlLnBhZ2VzLnNwbGljZSgkc2NvcGUucG9zLTIsIDEpO1xuXHRcdCRzY29wZS5wb3MgLS07XG5cdH1cbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dXNlcnM6IGZ1bmN0aW9uKFVzZXJGYWN0b3J5KSB7XG4gICAgICAgIFx0XHRyZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignSG9tZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIHVzZXJzLCAkaW50ZXJ2YWwpIHtcblx0Y29uc29sZS5sb2codXNlcnMpO1xuICAgIFxufSkiLCJhcHAuZGlyZWN0aXZlKCdncmVldGluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2dyZWV0aW5nL2dyZWV0aW5nLmh0bWwnXG4gICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYnJvd3NlU3RvcmllcycsIHtcbiAgICAgICAgdXJsOiAnL2Jyb3dzZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc3RvcnkvYnJvd3NlLXN0b3JpZXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdCcm93c2VTdG9yaWVzQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhdXRob3JzOiBmdW5jdGlvbihVc2VyRmFjdG9yeSkge1xuICAgICAgICBcdFx0cmV0dXJuIFVzZXJGYWN0b3J5LmZldGNoQWxsKCk7XG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Jyb3dzZVN0b3JpZXNDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBhdXRob3JzKSB7XG5cdCRzY29wZS5hdXRob3JzID0gYXV0aG9ycy5maWx0ZXIoZnVuY3Rpb24oYXV0aG9yKSB7XG4gICAgICAgIHJldHVybiBhdXRob3Iuc3Rvcmllcy5sZW5ndGg7XG4gICAgfSlcbiAgICBcbiAgICAkc2NvcGUuc3RvcmllcyA9IFtdO1xuICAgICRzY29wZS5hdXRob3JzLmZvckVhY2goZnVuY3Rpb24od3JpdGVyKSB7XG4gICAgICAgIHdyaXRlci5zdG9yaWVzLmZvckVhY2goZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgICAgIHN0b3J5LmF1dGhvciA9IHdyaXRlci5uYW1lO1xuICAgICAgICAgICAgJHNjb3BlLnN0b3JpZXMucHVzaChzdG9yeSk7XG4gICAgICAgIH0pXG4gICAgfSlcbiAgICBcbiAgICB2YXIgZ2VucmVzID0gWydTY2llbmNlIEZpY3Rpb24nLCAnUmVhbGlzdGljIEZpY3Rpb24nLCAnTm9uZmljdGlvbicsICdGYW50YXN5JywgJ1JvbWFuY2UnLCAnVHJhdmVsJywgJ0NoaWxkcmVuJywgJ0hvcnJvciddO1xuICAgICRzY29wZS5nZW5yZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdlbnJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAkc2NvcGUuZ2VucmVzLnB1c2goJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IGdlbnJlc1tpXTtcbiAgICAgICAgfSkpXG4gICAgfVxuICAgIC8vICRzY29wZS5zY2llbmNlRmljdGlvbiA9ICRzY29wZS5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgIC8vICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IFwiU2NpZW5jZSBGaWN0aW9uXCI7XG4gICAgLy8gfSlcbiAgICAvLyAkc2NvcGUucmVhbGlzdGljRmljdGlvbiA9ICRzY29wZS5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgIC8vICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IFwiUmVhbGlzdGljIEZpY3Rpb25cIjtcbiAgICAvLyB9KVxuICAgIC8vICRzY29wZS5ub25maWN0aW9uID0gJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgLy8gICAgIHJldHVybiBzdG9yeS5nZW5yZSA9PT0gXCJOb25maWN0aW9uXCI7XG4gICAgLy8gfSlcbiAgICAvLyAkc2NvcGUuZmFudGFzeSA9ICRzY29wZS5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgIC8vICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IFwiRmFudGFzeVwiO1xuICAgIC8vIH0pXG4gICAgLy8gJHNjb3BlLnJvbWFuY2UgPSAkc2NvcGUuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAvLyAgICAgcmV0dXJuIHN0b3J5LmdlbnJlID09PSBcIlJvbWFuY2VcIjtcbiAgICAvLyB9KVxuICAgIC8vICRzY29wZS50cmF2ZWwgPSAkc2NvcGUuc3Rvcmllcy5maWx0ZXIoZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAvLyAgICAgcmV0dXJuIHN0b3J5LmdlbnJlID09PSBcIlRyYXZlbFwiO1xuICAgIC8vIH0pXG4gICAgLy8gJHNjb3BlLmNoaWxkcmVuID0gJHNjb3BlLnN0b3JpZXMuZmlsdGVyKGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgLy8gICAgIHJldHVybiBzdG9yeS5nZW5yZSA9PT0gXCJDaGlsZHJlblwiO1xuICAgIC8vIH0pXG4gICAgLy8gJHNjb3BlLmhvcnJvciA9ICRzY29wZS5zdG9yaWVzLmZpbHRlcihmdW5jdGlvbihzdG9yeSkge1xuICAgIC8vICAgICByZXR1cm4gc3RvcnkuZ2VucmUgPT09IFwiSG9ycm9yXCI7XG4gICAgLy8gfSlcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZVN0b3J5Jywge1xuICAgICAgICB1cmw6ICcvc3RvcnkvOnN0b3J5SWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3N0b3J5L3NpbmdsZS1zdG9yeS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpbmdsZVN0b3J5Q3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRzdG9yeTogZnVuY3Rpb24oU3RvcnlGYWN0b3J5LCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgXHRcdHJldHVybiBTdG9yeUZhY3RvcnkuZmV0Y2hCeUlkKCRzdGF0ZVBhcmFtcy5zdG9yeUlkKTtcbiAgICAgICAgXHR9LFxuICAgICAgICAgICAgYXV0aG9yOiBmdW5jdGlvbihVc2VyRmFjdG9yeSwgc3RvcnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVXNlckZhY3RvcnkuZmV0Y2hCeUlkKHN0b3J5LnVzZXJJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2luZ2xlU3RvcnlDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBTdG9yeUZhY3RvcnksIHN0b3J5LCBhdXRob3IpIHtcblx0JHNjb3BlLmF1dGhvciA9IGF1dGhvci5uYW1lO1xuICAgICRzY29wZS5uZXdTdG9yeSA9IHN0b3J5O1xuICAgICRzY29wZS5wYWdlcyA9IHN0b3J5LnBhZ2VzO1xuICAgIGNvbnNvbGUubG9nKCdoZXJlIGlzIHRoZSBzaW5nbGUgc3Rvcnk6ICcsIHN0b3J5KTtcbiAgICB2YXIgdm9pY2UgPSBudWxsO1xuICAgICRzY29wZS5yZWFkQWxvdWQgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgIHZvaWNlID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIHZhciBtc2cgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlKHRleHQpO1xuICAgICAgICB2YXIgdm9pY2VzID0gd2luZG93LnNwZWVjaFN5bnRoZXNpcy5nZXRWb2ljZXMoKTtcbiAgICAgICAgY29uc29sZS5sb2codm9pY2VzKTtcbiAgICAgICAgbXNnLnZvaWNlID0gdm9pY2VzLmZpbHRlcihmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgcmV0dXJuIGVsLm5hbWUgPT09ICdDZWxsb3MnO1xuICAgICAgICB9KVswXTtcbiAgICAgICAgY29uc29sZS5sb2cobXNnKTtcbiAgICAgICAgd2luZG93LnNwZWVjaFN5bnRoZXNpcy5zcGVhayhtc2cpO1xuICAgICAgICAvLyB2b2ljZSA9IFZvaWNlUlNTLnNwZWVjaCh7XG4gICAgICAgIC8vICAgICBrZXk6ICcyZTcxNDUxOGU2YmE0NmRkOWM0ODcyOTAwZTg4MjU1YycsXG4gICAgICAgIC8vICAgICBzcmM6IHRleHQsXG4gICAgICAgIC8vICAgICBobDogJ2VuLWdiJyxcbiAgICAgICAgLy8gICAgIHI6IDAsIFxuICAgICAgICAvLyAgICAgYzogJ21wMycsXG4gICAgICAgIC8vICAgICBmOiAnNDRraHpfMTZiaXRfc3RlcmVvJyxcbiAgICAgICAgLy8gICAgIHNzbWw6IGZhbHNlXG4gICAgICAgIC8vIH0pO1xuICAgIH1cbn0pOyIsImFwcC5mYWN0b3J5KCdTdG9yeUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlKXtcblx0dmFyIHN0b3J5RmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS9zdG9yaWVzL1wiO1xuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaFB1Ymxpc2hlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAocHVibGlzaGVkU3Rvcmllcykge1xuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3JpZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LmZldGNoQWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ2FsbCcpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKGFsbFN0b3JpZXMpIHtcblx0XHRcdHJldHVybiBhbGxTdG9yaWVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS5mZXRjaEJ5SWQgPSBmdW5jdGlvbihzdG9yeUlkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgJ3N0b3J5LycgKyBzdG9yeUlkKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0Y29uc29sZS5sb2coc3RvcnkuZGF0YSk7XG5cdFx0XHRyZXR1cm4gc3RvcnkuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnB1Ymxpc2hTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoYmFzZVVybCwgc3RvcnkpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHB1Ymxpc2hlZFN0b3J5KSB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZygnaGVyZSBpdCBpczogJywgcHVibGlzaGVkU3RvcnkpXG5cdFxuXHRcdFx0cmV0dXJuIHB1Ymxpc2hlZFN0b3J5LmRhdGFcblx0XHR9KVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdG9yeSkge1xuXHRcdFx0Y29uc29sZS5sb2coc3RvcnkpO1xuXHRcdFx0JHN0YXRlLmdvKCdzaW5nbGVTdG9yeScsIHtzdG9yeUlkOiBzdG9yeS5pZH0pXG5cdFx0fSlcblx0XHRcblx0fVxuXG5cdHN0b3J5RmFjdG9yeS51cGRhdGVTdG9yeSA9IGZ1bmN0aW9uKHN0b3J5KSB7XG5cdFx0cmV0dXJuICRodHRwLnB1dChiYXNlVXJsICsgc3RvcnkuaWQsIHN0b3J5KVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1cGRhdGVkU3RvcnkpIHtcblx0XHRcdHJldHVybiB1cGRhdGVkU3RvcnkuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0c3RvcnlGYWN0b3J5LnJlYWQgPSBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnaHR0cDovL2FwaS52b2ljZXJzcy5vcmcvP2tleT0yZTcxNDUxOGU2YmE0NmRkOWM0ODcyOTAwZTg4MjU1YyZobD1lbi11cyZzcmM9JyArIHRleHQpXG5cdFx0LnRoZW4gKGZ1bmN0aW9uIChzb25nKSB7XG5cdFx0XHRyZXR1cm4gc29uZy5kYXRhO1xuXHRcdH0pXG5cdFx0LnRoZW4oIGZ1bmN0aW9uKHNvbmdUb1BsYXkpIHtcblx0XHRcdGNvbnNvbGUubG9nKHNvbmdUb1BsYXkpXG5cdFx0XHRcblx0XHR9KVxuXHR9XG5cblxuXG5cdHJldHVybiBzdG9yeUZhY3Rvcnk7XG5cbn0pIiwiYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSl7XG5cdHZhciB1c2VyRmFjdG9yeSA9IHt9O1xuXHR2YXIgYmFzZVVybCA9IFwiL2FwaS91c2Vycy9cIjtcblxuXG5cblx0dXNlckZhY3RvcnkuZmV0Y2hCeUlkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0cmV0dXJuICRodHRwLmdldChiYXNlVXJsICsgdXNlcklkKVxuXHRcdC50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gdXNlci5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHR1c2VyRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAkaHR0cC5nZXQoYmFzZVVybClcblx0XHQudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcblx0XHRcdHJldHVybiB1c2Vycy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRyZXR1cm4gdXNlckZhY3Rvcnk7XG59KTsiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
