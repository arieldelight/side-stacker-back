const { Op } = require("sequelize");
const { generateToken } = require("./token.services");
const { ClientError } = require("../errors");
const { Game } = require("./db.services");

// ////////////////////////////////////////
// SERVICES
// ////////////////////////////////////////

module.exports.getGame = async function (gameId, playerId) {
  return await Game.findOne({
    where: {
      id: gameId,
      [Op.or]: [{ redPlayerId: playerId }, { blackPlayerId: playerId }],
    },
  });
};

module.exports.getOrCreateGame = async function (playerId) {
  const [game, wasCreated] = await Game.findOrCreate({
    where: {
      blackPlayerId: null,
    },
    defaults: {
      id: generateToken(),
      redPlayerId: playerId,
      status: GameStates.WaitingForBlackToJoin,
      board: Array(7).fill(Array(7).fill(null)),
    },
  });
  if (!wasCreated) {
    game.blackPlayerId = playerId;
    game.status = GameStates.RedMoves;
    await game.save();
  }
  return game;
};

module.exports.placePiece = async function (gameId, playerId, row, column) {
  const game = await Game.findOne({ where: { id: gameId } });
  if (!game) {
    throw new ClientError("Invalid game ID");
  }

  const playerIsRed = validatePlayerCanMove(game, playerId);
  validateMoveIsValid(column, game, row);

  const board = game.board.map((_) => [..._]);
  board[row][column] = playerIsRed ? "R" : "B";
  game.board = board;
  game.status = playerIsRed ? GameStates.BlackMoves : GameStates.RedMoves;

  if (gameIsOver(game.board, row, column)) {
    game.status = GameStates.GameOver;
    game.winner = playerIsRed ? "red" : "black";
  }

  await game.save();

  return game;
};

function validatePlayerCanMove(game, playerId) {
  if (playerId !== game.redPlayerId && playerId !== game.blackPlayerId) {
    throw new ClientError("Invalid player ID");
  }
  if (game.status === GameStates.WaitingForBlackToJoin) {
    throw new ClientError("Game not started yet");
  }
  if (game.status === GameStates.GameOver) {
    throw new ClientError("Game is already over");
  }
  const playerIsRed = playerId === game.redPlayerId;
  if (playerIsRed && game.status !== GameStates.RedMoves) {
    throw new ClientError("Not red's turn");
  }
  if (!playerIsRed && game.status !== GameStates.BlackMoves) {
    throw new ClientError("Not black's turn");
  }
  return playerIsRed;
}

function validateMoveIsValid(column, game, row) {
  if (column < 0 || row < 0 || column > 6 || row > 6) {
    throw new ClientError("Invalid coordinates");
  }

  if (game.board[row][column]) {
    throw new ClientError("Cell already taken");
  }

  if (column === 0 || column === 6) {
    return;
  }

  const adjacentCells = Array(column - 1, column + 1).filter(
    (col) => 0 <= col && col <= 6
  );
  if (adjacentCells.every((col) => game.board[row][col] === null)) {
    throw new ClientError("Invalid move");
  }
}

function gameIsOver(board, row, col) {
  const vPaths = [row - 3, row - 2, row - 1, row].map((start) => [
    [start, col],
    [start + 1, col],
    [start + 2, col],
    [start + 3, col],
  ]);
  const hPaths = [col - 3, col - 2, col - 1, col].map((start) => [
    [row, start],
    [row, start + 1],
    [row, start + 2],
    [row, start + 3],
  ]);
  const d1Paths = [
    [row - 3, col - 3],
    [row - 2, col - 2],
    [row - 1, col - 1],
    [row, col],
  ].map(([_row, _col]) => [
    [_row, _col],
    [_row + 1, _col + 1],
    [_row + 2, _col + 2],
    [_row + 3, _col + 3],
  ]);
  const d2Paths = [
    [row + 3, col - 3],
    [row + 2, col - 2],
    [row + 1, col - 1],
    [row, col],
  ].map(([_row, _col]) => [
    [_row, _col],
    [_row - 1, _col + 1],
    [_row - 2, _col + 2],
    [_row - 3, _col + 3],
  ]);

  const allPaths = [...vPaths, ...hPaths, ...d1Paths, ...d2Paths].filter(
    (arr) =>
      arr.every(
        ([_row, _col]) => 0 <= _row && 0 <= _col && _row <= 6 && _col <= 6
      )
  );

  return allPaths.some((path) => winningPath(board, path));
}

function winningPath(board, path) {
  return (
    path.every(([row, col]) => board[row][col] === "R") ||
    path.every(([row, col]) => board[row][col] === "B")
  );
}

module.exports.gameIsOver = gameIsOver;

// ////////////////////////////////////////
// GAME STATUS
// ////////////////////////////////////////

const GameStates = {
  WaitingForBlackToJoin: "WAITING_FOR_BLACK_TO_JOIN",
  RedMoves: "RED_MOVES",
  BlackMoves: "BLACK_MOVES",
  GameOver: "GAME_OVER",
};

module.exports.GameStates = GameStates;
