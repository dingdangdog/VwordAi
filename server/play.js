const { play, azurePlaySSML } = require("./azure");
const { error } = require("./util");

const playTest = (model, text, provider) => {
  if (provider == "azure") {
    // console.log(model, text);
    return play(model, text);
  }
  return error("", "not support");
};

const playSSML = (text) => {
  return azurePlaySSML(text);
};

module.exports = {
  playTest,
  playSSML,
};
