/**
 * 项目相关API模块
 */
import type { Result, Project, Chapter } from "@/types";
import { invoke, invokeHandler } from "@/utils/apiBase";

/**
 * 项目相关API
 */
export const projectApi = {
  /**
   * 获取所有项目
   */
  getAll: () => invoke<Result<Project[]>>("get-projects"),

  /**
   * 获取项目详情
   * @param id 项目ID
   */
  getById: (id: string) => invoke<Result<Project>>("get-project", id),

  /**
   * 创建项目
   * @param data 项目数据
   */
  create: (data: any) => invoke<Result<Project>>("create-project", data),

  /**
   * 更新项目
   * @param id 项目ID
   * @param data 更新数据
   */
  update: (id: string, data: any) =>
    invoke<Result<Project>>("update-project", id, data),

  /**
   * 删除项目
   * @param id 项目ID
   */
  delete: (id: string) => invoke<Result<boolean>>("delete-project", id),

  /**
   * 通过处理器获取所有项目
   */
  getAllViaHandler: () => invokeHandler<Result<Project[]>>("getProjects"),

  /**
   * 通过处理器获取项目详情
   * @param id 项目ID
   */
  getByIdViaHandler: (id: string) =>
    invokeHandler<Result<Project>>("getProject", id),

  /**
   * 通过处理器创建项目
   * @param data 项目数据
   */
  createViaHandler: (data: any) =>
    invokeHandler<Result<Project>>("createProject", data),

  /**
   * 通过处理器更新项目
   * @param id 项目ID
   * @param data 更新数据
   */
  updateViaHandler: (id: string, data: any) =>
    invokeHandler<Result<Project>>("updateProject", id, data),

  /**
   * 通过处理器删除项目
   * @param id 项目ID
   */
  deleteViaHandler: (id: string) =>
    invokeHandler<Result<boolean>>("deleteProject", id),
};

/**
 * 章节相关API
 */
export const chapterApi = {
  /**
   * 获取项目下所有章节
   * @param projectId 项目ID
   */
  getByProjectId: (projectId: string) =>
    invoke<Result<Chapter[]>>("get-chapters-by-project-id", projectId),

  /**
   * 获取章节详情
   * @param id 章节ID
   */
  getById: (id: string) => invoke<Result<Chapter>>("get-chapter", id),

  /**
   * 创建章节
   * @param data 章节数据
   */
  create: (data: any) => invoke<Result<Chapter>>("create-chapter", data),

  /**
   * 更新章节
   * @param id 章节ID
   * @param data 更新数据
   */
  update: (id: string, data: any) =>
    invoke<Result<Chapter>>("update-chapter", id, data),

  /**
   * 删除章节
   * @param id 章节ID
   */
  delete: (id: string) => invoke<Result<boolean>>("delete-chapter", id),

  /**
   * 通过处理器获取项目下所有章节
   * @param projectId 项目ID
   */
  getByProjectIdViaHandler: (projectId: string) =>
    invokeHandler<Result<Chapter[]>>("getChaptersByProjectId", projectId),

  /**
   * 通过处理器获取章节详情
   * @param id 章节ID
   */
  getByIdViaHandler: (id: string) =>
    invokeHandler<Result<Chapter>>("getChapter", id),

  /**
   * 通过处理器创建章节
   * @param data 章节数据
   */
  createViaHandler: (data: any) =>
    invokeHandler<Result<Chapter>>("createChapter", data),

  /**
   * 通过处理器更新章节
   * @param id 章节ID
   * @param data 更新数据
   */
  updateViaHandler: (id: string, data: any) =>
    invokeHandler<Result<Chapter>>("updateChapter", id, data),

  /**
   * 通过处理器删除章节
   * @param id 章节ID
   */
  deleteViaHandler: (id: string) =>
    invokeHandler<Result<boolean>>("deleteChapter", id),
}; 