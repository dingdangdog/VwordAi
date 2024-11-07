const { play } = require("./azure");
const { error } = require("./util");

const playTest = (model, text, provider) => {
  if (provider == "azure") {
    // console.log(model, text);
    return play(model, text);
  }
  return error("", "not support");
};

module.exports = {
  playTest,
};
