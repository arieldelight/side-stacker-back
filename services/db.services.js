const { Sequelize, DataTypes } = require("sequelize");

module.exports.sequelize = {
  sqlite: () => new Sequelize("sqlite::memory:"),
  mysql: () =>
    new Sequelize("connect-four-sided", "root", "root", {
      host: "localhost",
      dialect: "mysql",
    }),
}[process.env.NODE_DB ?? "sqlite"]();

module.exports.Game = this.sequelize.define("Game", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  redPlayerId: DataTypes.STRING,
  blackPlayerId: DataTypes.STRING,
  board: {
    type: DataTypes.STRING(1024),
    get() {
      return JSON.parse(this.getDataValue("board"));
    },
    set(value) {
      const json = JSON.stringify(value);
      console.log(json);
      this.setDataValue("board", json);
    },
  },
  status: DataTypes.STRING,
  winner: DataTypes.STRING,
});

if (process.env.NODE_ENV !== "production") {
  this.sequelize
    .sync()
    .then((_) => console.log("[CONNECT-FOUR-SIDED-BACKEND] DB synced!"));
}
