const HttpClient = require("./http");
// const path = require("path");
// const fs = require("fs");

let token = "";
const login = async (param) => {
  const res = await HttpClient.post("/api/login", param);
  if (res.c == 200) {
    token = res.d.token;
  }
  // console.log(res);
  return res;
};

const register = async (param) => {
  const res = await HttpClient.post("/api/register", param);
  if (res.c == 200) {
    token = res.d.token;
  }
  return res;
};

const userInfo = () => {
  // console.log(token);
  return HttpClient.get("/api/user/info", {}, { Authorization: token });
};

const uploadProject = (project) => {
  return HttpClient.post("/api/project/upload", project, {
    Authorization: token,
  });
};

const getProjectPage = (page, param) => {
  return HttpClient.post("/api/project/upload", project, {
    Authorization: token,
  });
};

const getProjectContent = () => {
  return HttpClient.post("/api/project/upload", project, {
    Authorization: token,
  });
};

module.exports = {
  login,
  register,
  userInfo,
};
