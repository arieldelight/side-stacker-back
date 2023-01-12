const { gameIsOver } = require("../../services/games.services");

test("gameIsOver", () => {
  const board = [
    [null, null, null, "B", "B", "B", "R"],
    [null, null, null, null, null, null, "R"],
    [null, null, null, null, null, null, "R"],
    [null, null, null, null, null, null, "R"],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null],
  ];
  expect(gameIsOver(board, 3, 6)).toBeTruthy();
});
