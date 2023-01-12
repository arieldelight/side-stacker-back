MurmurHash3 = require("imurmurhash");

let id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

module.exports.generateToken = function () {
  return MurmurHash3((id++).toString()).result().toString();
};
