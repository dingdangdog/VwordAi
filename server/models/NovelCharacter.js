/**
 * 小说角色模型
 */
const { v4: uuidv4 } = require("uuid");
const storage = require("../utils/storage");
const Novel = require("./Novel");

// 存储文件名
const STORAGE_FILE = "novel-characters";

/**
 * 获取所有小说角色
 * @returns {Array} 角色列表
 */
function getAllNovelCharacters() {
  return storage.readData(STORAGE_FILE, []);
}

/**
 * 获取指定小说的所有角色
 * @param {string} novelId 小说ID
 * @returns {Array} 角色列表
 */
function getCharactersByNovelId(novelId) {
  const characters = getAllNovelCharacters();
  return characters.filter((character) => character.novelId === novelId);
}

/**
 * 根据ID获取小说角色
 * @param {string} id 角色ID
 * @returns {Object|null} 角色对象或null
 */
function getNovelCharacterById(id) {
  const characters = getAllNovelCharacters();
  return characters.find((character) => character.id === id) || null;
}

/**
 * 新建小说角色
 * @param {Object} characterData 角色数据
 * @returns {Object} 创建的角色
 */
function createNovelCharacter(characterData) {
  const characters = getAllNovelCharacters();

  // 检查小说是否存在
  const novel = Novel.getNovelById(characterData.novelId);
  if (!novel) {
    throw new Error("小说不存在");
  }

  // 检查角色名称在小说中是否唯一
  const novelCharacters = getCharactersByNovelId(characterData.novelId);
  if (novelCharacters.some((c) => c.name === characterData.name)) {
    throw new Error("角色名称在当前小说中已存在");
  }

  const now = new Date().toISOString();
  const newCharacter = {
    id: uuidv4(),
    novelId: characterData.novelId,
    name: characterData.name,
    type: characterData.type || "secondary", // "main", "secondary", "extra"
    gender: characterData.gender || "male", // "male", "female"
    age: characterData.age || "youth", // "child", "youth", "middle", "elder"
    description: characterData.description || "",
    voiceModel: characterData.voiceModel || "",
    aliases: characterData.aliases || [],
    createdAt: now,
    updatedAt: now,
  };

  characters.push(newCharacter);
  storage.saveData(STORAGE_FILE, characters);

  return newCharacter;
}

/**
 * 更新小说角色
 * @param {string} id 角色ID
 * @param {Object} characterData 更新的角色数据
 * @returns {Object|null} 更新后的角色或null
 */
function updateNovelCharacter(id, characterData) {
  const characters = getAllNovelCharacters();
  const index = characters.findIndex((character) => character.id === id);

  if (index === -1) {
    return null;
  }

  // 如果更改了名称，检查是否在小说中与其他角色重名
  if (characterData.name && characterData.name !== characters[index].name) {
    const novelCharacters = getCharactersByNovelId(characters[index].novelId);
    const nameExists = novelCharacters.some(
      (c) => c.id !== id && c.name === characterData.name
    );
    if (nameExists) {
      throw new Error("角色名称在当前小说中已存在");
    }
  }

  const updatedCharacter = {
    ...characters[index],
    name: characterData.name !== undefined ? characterData.name : characters[index].name,
    type: characterData.type !== undefined ? characterData.type : characters[index].type,
    gender: characterData.gender !== undefined ? characterData.gender : characters[index].gender,
    age: characterData.age !== undefined ? characterData.age : characters[index].age,
    description: characterData.description !== undefined ? characterData.description : characters[index].description,
    voiceModel: characterData.voiceModel !== undefined ? characterData.voiceModel : characters[index].voiceModel,
    aliases: characterData.aliases !== undefined ? characterData.aliases : characters[index].aliases,
    updatedAt: new Date().toISOString(),
  };

  characters[index] = updatedCharacter;
  storage.saveData(STORAGE_FILE, characters);

  return updatedCharacter;
}

/**
 * 删除小说角色
 * @param {string} id 角色ID
 * @returns {boolean} 是否删除成功
 */
function deleteNovelCharacter(id) {
  const characters = getAllNovelCharacters();
  const initialLength = characters.length;

  const filteredCharacters = characters.filter((character) => character.id !== id);

  if (filteredCharacters.length === initialLength) {
    return false; // 没有删除任何角色
  }

  storage.saveData(STORAGE_FILE, filteredCharacters);
  return true;
}

/**
 * 删除小说下的所有角色
 * @param {string} novelId 小说ID
 * @returns {number} 删除的角色数量
 */
function deleteCharactersByNovelId(novelId) {
  const characters = getAllNovelCharacters();
  const initialLength = characters.length;

  const filteredCharacters = characters.filter(
    (character) => character.novelId !== novelId
  );

  const deletedCount = initialLength - filteredCharacters.length;

  if (deletedCount > 0) {
    storage.saveData(STORAGE_FILE, filteredCharacters);
  }

  return deletedCount;
}

/**
 * 根据名称或别名查找角色
 * @param {string} novelId 小说ID
 * @param {string} name 角色名称或别名
 * @returns {Object|null} 角色对象或null
 */
function findCharacterByName(novelId, name) {
  const characters = getCharactersByNovelId(novelId);
  return characters.find(character => {
    return character.name === name || 
           (character.aliases && character.aliases.includes(name));
  }) || null;
}

module.exports = {
  getAllNovelCharacters,
  getCharactersByNovelId,
  getNovelCharacterById,
  createNovelCharacter,
  updateNovelCharacter,
  deleteNovelCharacter,
  deleteCharactersByNovelId,
  findCharacterByName,
};
