import type { Plugin } from './type';

export interface PluginPriorityItem {
  name: string;
  priority: number;
}

// 默认插件优先级配置 - 数值越小优先级越高（越先执行）
const PLUGIN_DEFAULT_PRIORITY: ReadonlyArray<PluginPriorityItem> = [
  { name: 'useReadyPlugin', priority: 10 },
  { name: 'useCachePlugin', priority: 20 },
  { name: 'useLoadingDelayPlugins', priority: 30 },
  { name: 'useDebouncePlugin', priority: 40 },
  { name: 'useThrottlePlugin', priority: 50 },
  { name: 'usePollingPlugin', priority: 60 },
  { name: 'useRetryPlugin', priority: 70 },
  { name: 'useRefreshDepsPlugin', priority: 80 },
  { name: 'useWindowVisibilityChangePlugin', priority: 90 },
] as const;

// 全局状态
let pluginPriorityMap: Map<string, number>;
let globalPlugins: Plugin<any, any[]>[] = [];
let sortedBasePlugins: Plugin<any, any[]>[] = [];

// 基础插件列表
let BASE_PLUGINS: Plugin<any, any[]>[] = [];

export function setBasePlugins(plugins: Plugin<any, any[]>[]): void {
  BASE_PLUGINS = plugins;
}

// 初始化优先级映射
export function initializePluginPriorityMap() {
  pluginPriorityMap = new Map(PLUGIN_DEFAULT_PRIORITY.map((item) => [item.name, item.priority]));
}

// 对插件列表进行排序（从小到大）
export function sortPlugins(plugins: Plugin<any, any[]>[]): Plugin<any, any[]>[] {
  return [...plugins].sort((a, b) => {
    const priorityA = pluginPriorityMap.get(a.name) || 0;
    const priorityB = pluginPriorityMap.get(b.name) || 0;
    return priorityA - priorityB; // 从小到大排序
  });
}

// 更新基础插件排序
export function updateBasePluginsSort() {
  sortedBasePlugins = sortPlugins(BASE_PLUGINS);
}

// 为插件设置优先级（如果没有设置）
export function ensurePluginPriority(plugins: Plugin<any, any[]>[]): void {
  plugins.forEach((plugin) => {
    if (!pluginPriorityMap.has(plugin.name)) {
      const maxPriority = Math.max(...pluginPriorityMap.values(), 0) + 10;
      pluginPriorityMap.set(plugin.name, maxPriority);
    }
  });
}

// 定义全局插件和优先级
export function definePlugins(plugins: Plugin<any, any[]>[] = [], priorityItems: PluginPriorityItem[] = []) {
  priorityItems.forEach((item) => {
    pluginPriorityMap.set(item.name, item.priority);
  });

  globalPlugins = plugins || [];

  ensurePluginPriority(globalPlugins);

  updateBasePluginsSort();
}

// 获取排序后的插件列表（包含自定义插件）
export function getSortedPlugins(customPlugins: Plugin<any, any[]>[] = []): Plugin<any, any[]>[] {
  ensurePluginPriority(customPlugins);

  const allPluginsMap = new Map<string, Plugin<any, any[]>>();

  [...sortedBasePlugins, ...globalPlugins, ...customPlugins].forEach((plugin) => {
    allPluginsMap.set(plugin.name, plugin);
  });

  const uniquePlugins = Array.from(allPluginsMap.values());

  return sortPlugins(uniquePlugins);
}

export function getPluginPriorityMap(): Map<string, number> {
  return pluginPriorityMap;
}

export function getGlobalPlugins(): Plugin<any, any[]>[] {
  return globalPlugins;
}

export function getSortedBasePlugins(): Plugin<any, any[]>[] {
  return sortedBasePlugins;
}
