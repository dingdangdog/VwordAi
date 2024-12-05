const { saveAccount, getConfig } = require("./config");
const HttpClient = require("./http");
const { success } = require("./util");
// const path = require("path");
// const fs = require("fs");

let token = "";
const login = async (param, saveFlag) => {
  // console.log(param, saveFlag);
  const res = await HttpClient.post("/api/login", param);
  if (res.c == 200) {
    token = res.d.token;
    if (saveFlag && saveFlag.save) {
      // 保存账号密码
      saveAccount(param.account, param.password, token, saveFlag);
    }
  }
  // console.log(res);
  return res;
};

const logout = () => {
  token = "";
  return success(null);
};

const register = async (param, saveFlag) => {
  const res = await HttpClient.post("/api/register", param);
  if (res.c == 200) {
    token = res.d.token;
  }
  return res;
};

const userInit = async () => {
  const config = getConfig();
  // console.log(config);
  if (config.account.autoLogin) {
    const account = {
      account: config.account.data.account,
      password: config.account.data.password,
    };
    const res = await login(account);
    return {
      ...res,
      ...account,
    };
  }

  return success(null);
};

const userInfo = () => {
  // console.log(token);
  return HttpClient.get("/api/user/info", {}, { Authorization: token });
};

const userOrder = (pageParam, queryParam) => {
  // console.log(token);
  return HttpClient.post(
    "/api/order/page",
    { ...pageParam, ...queryParam },
    { Authorization: token }
  );
};

// 用户项目分页列表
const userProject = (pageParam, queryParam) => {
  // console.log(token);
  return HttpClient.post(
    "/api/project/page",
    { ...pageParam, ...queryParam },
    { Authorization: token }
  );
};

const userUsed = (pageParam, queryParam) => {
  // console.log(token);
  return HttpClient.post(
    "/api/used/page",
    { ...pageParam, ...queryParam },
    { Authorization: token }
  );
};

const uploadProject = (project) => {
  return HttpClient.post("/api/project/upload", project, {
    Authorization: token,
  });
};

const getProject = (id) => {
  return HttpClient.get("/api/project/get", { id }, { Authorization: token });
};

const deleteProject = (id) => {
  return HttpClient.post("/api/project/del", { id }, { Authorization: token });
};

const getCombos = () => {
  return HttpClient.post("/combos");
};

const createOrder = (order) => {
  return HttpClient.post("/api/order/create", order, {
    Authorization: token,
  });
};
const queryOrder = (no) => {
  return HttpClient.get("/api/order/query", no, {
    Authorization: token,
  });
};
const cancelOrder = (no) => {
  return HttpClient.post("/api/order/cancel", no, {
    Authorization: token,
  });
};

module.exports = {
  login,
  logout,
  register,
  userInit,
  userInfo,
  getCombos,
  userOrder,
  userProject,
  userUsed,
  uploadProject,
  getProject,
  deleteProject,
  createOrder,
  queryOrder,
  cancelOrder,
};
