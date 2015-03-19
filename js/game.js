BasicGame.Game = function (game) {

};

var TILE_COUNT = 25;

var LifeTile = function() {
  this.sprite = null;
  this.alive = false;
};

LifeTile.prototype.setAlive = function() {
  this.alive = true;
  this.sprite.frame = 1;
};

LifeTile.prototype.setDead = function() {
  this.alive = false;
  this.sprite.frame = 0;
};

LifeTile.prototype.setLifeState = function(state) {
  if (state === true) {
    this.setAlive();
  } else {
    this.setDead();
  }
};

LifeTile.prototype.handleClick = function(game) {
  game.updateTiles(this);
};

LifeTile.prototype.countLiveNeighbors = function(tiles) {
  var x = this.x;
  var y = this.y;
  // If a tiles[n] goes out of bounds it'll evaluate to undefined, so use a
  // dummy array to prevent a TypeError when indexing with y.
  neighbors = [
    (tiles[x-1]||[])[y-1], tiles[x][y-1], (tiles[x+1]||[])[y-1],
    (tiles[x-1]||[])[y],                  (tiles[x+1]||[])[y],
    (tiles[x-1]||[])[y+1], tiles[x][y+1], (tiles[x+1]||[])[y+1]
  ];
  var count = 0;
  neighbors.forEach(function(neighbor) {
    if (neighbor !== undefined && neighbor.alive === true) {
      count++;
    }
  });
  return count;
};

BasicGame.Game.prototype = {

    create: function () {
      this.game.stage.backgroundColor = 0x212121;
      this.rnd.sow([Date.now()]);
      this.tiles = [];

      for (var i=0; i<TILE_COUNT; i++) {
        this.tiles.push([]);
        for (var j=0; j<TILE_COUNT; j++) {
          var lifeTile = new LifeTile();
          lifeTile.sprite = this.game.add.sprite(i*32, j*32, 'lifeTiles');
          lifeTile.sprite.inputEnabled = true;
          lifeTile.sprite.events.onInputDown.add(lifeTile.handleClick.bind(lifeTile, this), lifeTile);
          lifeTile.x = i;
          lifeTile.y = j;
          this.tiles[i][j] = lifeTile;
        }
      }

      for (i=0; i<this.rnd.integerInRange(4,10); i++) {
        var x = this.rnd.integerInRange(10, 16);
        var y = this.rnd.integerInRange(10, 16);
        this.tiles[x][y].setAlive();
      }

      this.lifeSound = this.add.audio('lifeSound');
      this.deathSound = this.add.audio('deathSound');
      this.loseSound = this.add.audio('loseSound');
      this.lifeSound.allowMultiple = true;
      this.deathSound.allowMultiple = true;
    },

    update: function () {
      //  Honestly, just about anything could go here. It's YOUR game after all. Eat your heart out!
    },

    /*
     * Sets a player-selected tile to alive and updates the life state of
     * each tile based on the new state.
     */
    updateTiles: function(selectedTile) {
      if (selectedTile.alive === true) {
        this.deathSound.play();
        selectedTile.setDead();
      } else {
        this.lifeSound.play();
        selectedTile.setAlive();
      }
      var beforeLifeState = selectedTile.alive;
      var tiles = this.frozenTilesState();
      var lifeCount = 0;
      // Apply the rules of game of Conway's Game of Life for each tile.
      for (var i=0; i<TILE_COUNT; i++) {
        for (var j=0; j<TILE_COUNT; j++) {
          var tile = this.tiles[i][j];
          var count = tile.countLiveNeighbors(tiles);
          if (count < 2 || count > 3) {
            tile.setDead();
          } else if (tile.alive === false && count === 3) {
            tile.setAlive();
          }
          if (tile.x !== selectedTile.x || tile.y !== selectedTile.y) {
            lifeCount += tile.alive === true ? 1 : 0;
          }
        }
      }
      selectedTile.setLifeState(beforeLifeState);
      lifeCount += selectedTile.alive === true ? 1 : 0;
      if (lifeCount <= 1) {
        this.loseSound.play();
        this.state.restart(true, false, {});
      }
    },

    /*
     * Freeze the state of each tile so countLiveNeighbors can operate
     * on an immutable state of the current turn.
     */
    frozenTilesState: function() {
      var frozenTiles = [];
      for (var i=0; i<TILE_COUNT; i++) {
        frozenTiles.push([]);
        for (var j=0; j<TILE_COUNT; j++) {
          var match = this.tiles[i][j];
          frozenTiles[i][j] = { alive: match.alive };
        }
      }
      return frozenTiles;
    },

    quitGame: function (pointer) {
      //  Here you should destroy anything you no longer need.
      //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

      //  Then let's go back to the main menu.
      this.state.start('MainMenu');
    }

};
