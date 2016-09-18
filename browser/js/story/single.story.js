app.config(function ($stateProvider) {
    $stateProvider.state('singleStory', {
        url: '/story/:storyId',
        templateUrl: 'js/story/single-story.html',
        controller: 'SingleStoryCtrl',
        resolve: {
        	story: function(StoryFactory, $stateParams) {
        		return StoryFactory.fetchById($stateParams.storyId);
        	},
            author: function(UserFactory, story) {
                return UserFactory.fetchById(story.userId);
            }
        }
    });
});

app.controller('SingleStoryCtrl', function($scope, StoryFactory, story, author) {
	$scope.author = author.name;
    $scope.newStory = story;
    $scope.pages = story.pages;
    console.log('here is the single story: ', story);
    var voice = null;
    $scope.readAloud = function(text) {
        voice = null;
        
        var msg = new SpeechSynthesisUtterance(text);
        var voices = window.speechSynthesis.getVoices();
        console.log(voices);
        msg.voice = voices.filter(function(el) {
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
    }
});