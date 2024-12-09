const fs = require("fs");
const path = require("path");
const HttpClient = require("./http");
const { success, error } = require("./util");
const { saveAccount, getConfig, saveConfig } = require("./config");
const { getEmotions, getModels, saveModels, saveEmotions } = require("./model");

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

const logout = (token) => {
  return HttpClient.get("/api/logout", {}, { Authorization: token });
};

const register = async (param, saveFlag) => {
  return await HttpClient.post("/api/register", param);
};

const saveCloudConfig = (token) => {
  const config = getConfig();
  const models = getModels();
  const emotions = getEmotions();
  return HttpClient.post(
    "/api/user/saveConfig",
    {
      config: JSON.stringify(config),
      models: JSON.stringify(models.d),
      emotions: JSON.stringify(emotions.d),
    },
    {
      Authorization: token,
    }
  );
};

const loadCloudConfig = async (token) => {
  const res = await HttpClient.get(
    "/api/user/loadConfig",
    {},
    {
      Authorization: token,
    }
  );
  // console.log(res);
  if (res.c == 200 && res.d) {
    // 覆盖本地配置文件
    saveConfig(JSON.parse(res.d.config));
    saveModels(JSON.parse(res.d.models));
    saveEmotions(JSON.parse(res.d.emotions));
  }
  return res;
};

const userInit = async () => {
  const config = getConfig();
  // console.log(config);
  if (config.account?.autoLogin) {
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

const userInfo = (token) => {
  // console.log(token);
  return HttpClient.get("/api/user/info", {}, { Authorization: token });
};

const userOrder = (pageParam, queryParam, token) => {
  // console.log(token);
  return HttpClient.post(
    "/api/order/page",
    { ...pageParam, ...queryParam },
    { Authorization: token }
  );
};

const userFundlogs = (pageParam, queryParam, token) => {
  return HttpClient.post(
    "/api/fundlogs/page",
    { ...pageParam, ...queryParam },
    { Authorization: token }
  );
};

// 用户项目分页列表
const userProject = (pageParam, queryParam, token) => {
  // console.log(token);
  return HttpClient.post(
    "/api/project/page",
    { ...pageParam, ...queryParam },
    { Authorization: token }
  );
};

const uploadProject = (project, token) => {
  return HttpClient.post("/api/project/upload", project, {
    Authorization: token,
  });
};

const getProjectDetail = (id, token) => {
  return HttpClient.get("/api/project/get", { id }, { Authorization: token });
};

const cloudDotts = (id, token) => {
  return HttpClient.get("/api/project/dotts", { id }, { Authorization: token });
};

const deleteProject = (id, token) => {
  return HttpClient.post("/api/project/del", { id }, { Authorization: token });
};

const pullProject = async (id, token) => {
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

  const projectFile = path.join(projectPath, "project.json");

  // 保存项目配置和数据
  fs.writeFileSync(projectFile, JSON.stringify(project));
  return success(null);
};

const downloadAudio = async (id, token) => {
  const response = await HttpClient.download(
    "/api/project/download",
    "GET",
    { id },
    {
      Authorization: token,
    }
  );
  const contentDisposition = response.headers["content-disposition"];
  const fileName =
    Date.now() +
    "-" +
    decodeURI(contentDisposition.split("=")[1].replaceAll('"', ""));
  const config = getConfig();
  const dataPath = config.dataPath;
  const filePath = path.join(dataPath, id, fileName);
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
const createOrder = (order, token) => {
  return HttpClient.post("/api/order/create", order, {
    Authorization: token,
  });
};
const queryOrder = (no, token) => {
  return HttpClient.get("/api/order/query", no, {
    Authorization: token,
  });
};
const cancelOrder = (no, token) => {
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
  userFundlogs,
  uploadProject,
  getProjectDetail,
  deleteProject,
  createOrder,
  queryOrder,
  cancelOrder,
  cloudDotts,
  downloadAudio,
  pullProject,
  saveCloudConfig,
  loadCloudConfig,
};
