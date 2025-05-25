/**
 * 项目相关API模块
 */
import type { Result, Project, Chapter } from "@/types";
import { invoke } from "@/utils/apiBase";

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


};