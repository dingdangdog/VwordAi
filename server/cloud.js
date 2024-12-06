const { saveAccount, getConfig } = require("./config");
const HttpClient = require("./http");
const { success, error } = require("./util");
const path = require("path");
const fs = require("fs");

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

const getProjectDetail = (id) => {
  return HttpClient.get("/api/project/get", { id }, { Authorization: token });
};

const cloudDotts = (id) => {
  return HttpClient.get("/api/project/dotts", { id }, { Authorization: token });
};

const deleteProject = (id) => {
  return HttpClient.post("/api/project/del", { id }, { Authorization: token });
};

const pullProject = async (id) => {
  const res = await HttpClient.get(
    "/api/project/get",
    { id },
    { Authorization: token }
  );
  if (res.c != 200) {
    return res;
  }
  const project = res.d;
  const config = getConfig();
  const dataPath = config.dataPath;
  const projectPath = path.join(dataPath, project.id);
  // 确保保存路径的文件夹存在
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  const projectFile = path.join(projectPath, `${project.id}.json`);

  // 保存项目配置和数据
  fs.writeFileSync(projectFile, JSON.stringify(project));
  return success(null);
};

const downloadAudio = async (id) => {
  const response = await HttpClient.download(
    "/api/project/download",
    "GET",
    { id },
    {
      Authorization: token,
    }
  );
  const contentDisposition = response.headers["content-disposition"];
  const fileName = decodeURI(
    contentDisposition.split("=")[1].replaceAll('"', "")
  );
  const config = getConfig();
  const dataPath = config.dataPath;
  const filePath = path.join(dataPath, fileName.split(".")[0], fileName);
  // 确保保存路径的文件夹存在
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  // 创建写入流并将数据保存到本地
  const writer = fs.createWriteStream(filePath);
  // console.log("response.data");
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      // console.log("音频文件已保存到:", filePath);
      resolve(success(null));
    });

    writer.on("error", (err) => {
      // console.error("保存音频文件时出错:", err);
      reject(error(err));
    });
  });
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
  getProjectDetail,
  deleteProject,
  createOrder,
  queryOrder,
  cancelOrder,
  cloudDotts,
  downloadAudio,
  pullProject,
};
