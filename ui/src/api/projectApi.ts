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
  getAll: () => invoke<Result<Project[]>>("project:get-all"),

  /**
   * 获取项目详情
   * @param id 项目ID
   */
  getById: (id: string) => invoke<Result<Project>>("project:get", id),

  /**
   * 创建项目
   * @param data 项目数据
   */
  create: (data: any) => invoke<Result<Project>>("project:create", data),

  /**
   * 更新项目
   * @param id 项目ID
   * @param data 更新数据
   */
  update: (id: string, data: any) =>
    invoke<Result<Project>>("project:update", id, data),

  /**
   * 删除项目
   * @param id 项目ID
   */
  delete: (id: string) => invoke<Result<boolean>>("project:delete", id),


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
    invoke<Result<Chapter[]>>("project-chapter:get-by-project", projectId),

  /**
   * 获取章节详情
   * @param id 章节ID
   */
  getById: (id: string) => invoke<Result<Chapter>>("project-chapter:get", id),

  /**
   * 创建章节
   * @param data 章节数据
   */
  create: (data: any) => invoke<Result<Chapter>>("project-chapter:create", data),

  /**
   * 更新章节
   * @param id 章节ID
   * @param data 更新数据
   */
  update: (id: string, data: any) =>
    invoke<Result<Chapter>>("project-chapter:update", id, data),

  /**
   * 删除章节
   * @param id 章节ID
   */
  delete: (id: string) => invoke<Result<boolean>>("project-chapter:delete", id),


};