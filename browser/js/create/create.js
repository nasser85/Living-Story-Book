app.config(function ($stateProvider) {
    $stateProvider.state('create', {
        url: '/create',
        templateUrl: 'js/create/create.html',
        controller: 'CreateCtrl'
    });
});

app.controller('CreateCtrl', function($scope, StoryFactory, $state) {
	$scope.messages = ["select a genre for your new story", "design the cover of your story book", "design your book's pages"]
	$scope.newStory = {
		title: "My New Story",
		status: "incomplete",
		cover_url: "not-available.jpg",
		genre: "none",
		userId: 1,
		pages: null
	}
	$scope.pos = 0;
	$scope.author = "anonymous"


	$scope.pages = [
		{
			image_url: "not-available.jpg",
			content: ""
		}
	];

	$scope.myGenre = "none";
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
			type: 'Adult',
			image: 'adult.jpg',
		},
		{
			type: 'none',
			image: 'none.jpg',
		}
	];

	$scope.selectGenre = function(genre) {
		$scope.myGenre = genre;
		console.log($scope.myGenre);
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
		$scope.newStory.status = "published";
		$scope.newStory.pages = $scope.pages;
		StoryFactory.publishStory($scope.newStory)
	}
	// $scope.publish = function() {
	// 	StoryFactory.publishStory()
	// 	.then(function(publishedStory) {
	// 		if (publishedStory) {
	// 			$state.go('story', {storyId: publishedStory.id })
	// 		}
			
	// 	});
	// }

	$scope.deletePage = function() {
		$scope.pages.splice($scope.pos-2, 1);
		$scope.pos --;
	}
});