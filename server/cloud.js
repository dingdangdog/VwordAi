const HttpClient = require("./http");

const login = (param) => {
  return HttpClient.post("/api/login", param);
};

const register = (param) => {
  return HttpClient.post("/api/register", param);
};

module.exports = {
  login,
  register,
};
