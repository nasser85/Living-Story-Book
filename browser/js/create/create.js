app.config(function ($stateProvider) {
    $stateProvider.state('create', {
        url: '/create',
        templateUrl: 'js/create/create.html',
        controller: 'CreateCtrl',
        resolve: {
        	user: function(AuthService) {
        		return AuthService.getLoggedInUser();
        	}
        }
    });
});

app.controller('CreateCtrl', function($scope, StoryFactory, $state, user, $rootScope) {
	$scope.user = user;
	$scope.message = null;
	$scope.messages = ["select a genre for your new story", "design the cover of your story book", "design your book's pages", "Please wait while your book is published.", "Please wait while your book is saved."]
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
		}
		$scope.pages = [
			{
				image_url: "not-available.jpg",
				content: ""
			}
		];
		$scope.pos = 0;
	}
	
	$scope.author = "anonymous"
	if (user) {
		$scope.author = user.name;
		$scope.newStory.userId = user.id; 
	}
	
	$scope.images = [];
	for (var i = 0; i < 267; i++) {

		$scope.images.push(i.toString() + '.png');
	}
	

	

	$scope.genres = [
		{
			type: 'Science Fiction',
			image: 'science-fiction.jpg',
		},
		{
			type: 'Realistic Fiction',
			image: 'realistic-fiction.jpg',
		},
		{
			type: 'Nonfiction',
			image: 'nonfiction.jpg',
		},
		{
			type: 'Fantasy',
			image: 'fantasy.jpg',
		},
		{
			type: 'Romance',
			image: 'romance.jpg',
		},
		{
			type: 'Travel',
			image: 'travel.jpg',
		},
		{
			type: 'Children',
			image: 'children.jpg',
		},
		{
			type: 'Horror',
			image: 'adult.jpg',
		}
	];

	$scope.selectGenre = function(genre) {
		$scope.newStory.genre = genre;
		console.log($scope.newStory.genre);
		$scope.pos ++;
		window.scroll(0,0);
	}

	$scope.goBack = function() {
		$scope.pos --;
	}
	$scope.nextPage = function() {
		$scope.pos ++;
	}

	$scope.submitTitle = function() {
		$scope.pos ++;
		window.scroll(0,0);
	}

	$scope.submitPage = function() {
		$scope.pages.push({image_url: "not-available.jpg", content: ''});
		$scope.pos = $scope.pages.length + 1;
		window.scroll(0,0);
	}

	$scope.selectCover = function(url) {
		$scope.newStory.cover_url = url;
	}

	$scope.selectPageImage = function(url) {
		$scope.pages[$scope.pos-2].image_url = url;
	}

	$scope.publish = function() {
		if (!$scope.message) {
			$scope.message = $scope.messages[3];
			$scope.newStory.status = "published";
			$scope.newStory.pages = $scope.pages;
			if ($scope.newStory.id) {
				StoryFactory.updateStory($scope.newStory)
			} else {
				StoryFactory.publishStory($scope.newStory);
			}
			$rootScope.pageUpdate = true;
		}
	}

	$scope.saveStory = function() {
		if (!$scope.message) {
			$scope.message = $scope.messages[4];
			$scope.newStory.pages = $scope.pages;
			if ($scope.newStory.id) {
				StoryFactory.updateStory($scope.newStory)
			} else {
				StoryFactory.publishStory($scope.newStory);
			}
			$rootScope.pageUpdate = true;
		}
	}

	$scope.deletePage = function() {
		$scope.pages.splice($scope.pos-2, 1);
		$scope.pos --;
	}
});