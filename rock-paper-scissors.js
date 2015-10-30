Results = new Mongo.Collection("results");

Router.route('/player1', {template: 'board'});
Router.route('/player2', {template: 'board'});
Router.route('/admin', {template: 'board'});

var GameChoices = {
  Rock: "rock",
  Paper: "paper",
  Scissors: 'scissors'
}

var setImage = function(player, selection){
  var image = player === 'player1' ? 'playerOneImage' : 'playerTwoImage';
  var selectionImage;
  switch(selection){
    case GameChoices.Rock:
      selectionImage = 'images/rock.jpg';
      break;
    case GameChoices.Paper:
      selectionImage = 'images/paper.jpg';
      break;
    case GameChoices.Scissors:
      selectionImage = 'images/scissors.jpg'
      break;
  }
  document.getElementById(image).src = selectionImage;
}

if (Meteor.isClient) {
  Meteor.subscribe("results");

  Template.board.events({
    'click #rock': function() {
      var player = Router.current().route.getName();
      Meteor.call('makeSelection', player, GameChoices.Rock);
      setImage(player, GameChoices.Rock);
    },
    'click #paper': function() {
      var player = Router.current().route.getName();
      Meteor.call('makeSelection', Router.current().route.getName(), GameChoices.Paper);
      setImage(player, GameChoices.Paper);
    },
    'click #scissors': function() {
      var player = Router.current().route.getName();
      Meteor.call('makeSelection', Router.current().route.getName(), GameChoices.Scissors);
      setImage(player, GameChoices.Scissors);
    },
    'click #reset': function() {
      Meteor.call('resetGame');
    }
  });

  Template.board.helpers({
    pastGameResults: function(){
      return Results.find({winner: {$ne: null}});
    },
    isPlayerOne: function(){
      return Router.current().route.getName() === 'player1';
    },
    isPlayerTwo: function(){
      return Router.current().route.getName() === 'player2';
    },
    isPlayer: function(){
      return Router.current().route.getName() !== 'admin';
    },
    isAdmin: function(){
      return Router.current().route.getName() === 'admin';
    },
    playerOneScore: function(){
      return Results.find({winner: "Player 1"}).count();
    },
    playerTwoScore: function(){
      return Results.find({winner: 'Player 2'}).count();
    },
    playerOneSelected: function(){
      return Results.find({},{sort: {createdAt: -1}}).fetch()[0].playerOneSelection !== null
    },
    playerTwoSelected: function(){
      return Results.find({},{sort: {createdAt: -1}}).fetch()[0].playerTwoSelection !== null
    },
    playerOneSelection: function(){
      var currentGame = Results.find({},{sort: {createdAt: -1}}).fetch()[0];
      return currentGame.playerOneSelection;
    },
    playerTwoSelection: function(){
      var currentGame = Results.find({},{sort: {createdAt: -1}}).fetch()[0];
      return currentGame.playerTwoSelection;
    }
  })
}

if (Meteor.isServer) {
  var results = Results.find({}, {sort: {createdAt: -1}});
  if(results.count() === 0 || results.fetch()[0].winner !== null){
    Results.insert({
      createdAt: new Date(),
      playerOneSelection: null,
      playerTwoSelection: null,
      winner: null
    });
  }
  Meteor.publish('results', function(){
    return Results.find();
  });
}

Meteor.methods({
  makeSelection: function(player, selection){
    var games = Results.find({},{sort: {createdAt: -1}}).fetch();

    var checkWinner = function(){
      games = Results.find({},{sort: {createdAt: -1}}).fetch();
      if(games[0].playerOneSelection !== null && games[0].playerTwoSelection !== null){
        var winner = Meteor.call('determineWinner', games[0].playerOneSelection, games[0].playerTwoSelection);
        Results.update(games[0]._id, {$set: {winner: winner}});
        Meteor.call('startNewGame');
      }
    }
    if(player === 'player1'){
      Results.update(games[0]._id, {$set: {playerOneSelection: selection}}, {}, checkWinner);
    }
    else{
      Results.update(games[0]._id, {$set: {playerTwoSelection: selection}}, {}, checkWinner);
    }
  },

  determineWinner: function(playerOneChoice, playerTwoChoice){
    //Rock v Rock, Paper v Paper, Scissors v Scissors
    if(playerOneChoice === playerTwoChoice){
      return 'Tie';
    }
    switch(playerOneChoice)
    {
      case GameChoices.Rock:
        return playerTwoChoice === GameChoices.Scissors ? 'Player 1' : 'Player 2';
      case GameChoices.Scissors:
        return playerTwoChoice === GameChoices.Rock ? 'Player 2' : 'Player 1';
      case GameChoices.Paper:
        return playerTwoChoice === GameChoices.Rock ? 'Player 1' : 'Player 2';
    }
  },

  startNewGame: function(){
    Results.insert({
      createdAt: new Date(),
      playerOneSelection: null,
      playerTwoSelection: null,
      winner: null
    });
  },

  resetGame: function(){
    var results = Results.find().fetch();
    for(var i = 0; i < results.length; i++){
      Results.remove(results[i]._id);
    }
    Meteor.call('startNewGame');
  }

})
