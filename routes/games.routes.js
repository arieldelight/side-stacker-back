const express = require("express");
const {
  getOrCreateGame,
  placePiece,
  getGame,
  createSinglePlayerGame,
} = require("../services/games.services");
const { generateToken } = require("../services/token.services");
const { ClientError } = require("../errors");

const router = express.Router();

router.post("/", async function (req, res, next) {
  const playerId = generateToken();
  const gameType = req.query.gameType;

  try {
    const game = await (gameType === "single player"
      ? createSinglePlayerGame(playerId)
      : getOrCreateGame(playerId));
    res.send(toResponse(game, playerId));
  } catch (error) {
    res.status(error instanceof ClientError ? 400 : 500);
    res.send({ message: error.message });
  }
});

router.get("/:gameId", async function (req, res) {
  const playerId = req.query.playerId;
  if (!playerId) {
    res.status(400);
    res.send({ message: "must send playerId" });
    return;
  }

  const game = await getGame(req.params.gameId, playerId);

  if (!game) {
    res.status(404);
    res.send({ message: "Game not found" });
    return;
  }

  res.send(toResponse(game, playerId));
});

router.patch("/:gameId", async function (req, res) {
  const { playerId, row, column } = req.body;
  try {
    const game = await placePiece(
      req.params.gameId,
      playerId,
      Number(row),
      Number(column)
    );
    res.send(toResponse(game, playerId));
  } catch (error) {
    res.status(error instanceof ClientError ? 400 : 500);
    res.send({ message: error.message });
  }
});

function toResponse(game, playerId) {
  return {
    gameId: game.id,
    playerId: playerId,
    playerColor: game.redPlayerId === playerId ? "red" : "black",
    status: game.status,
    board: game.board,
    ...(game.winner ? { winner: game.winner } : {}),
  };
}

module.exports = router;
