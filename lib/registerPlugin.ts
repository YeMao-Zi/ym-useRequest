import type { Plugin } from './type';

export interface PluginPriorityItem {
  name: string;
  priority: number;
}

// 默认插件优先级配置 - 数值越小优先级越高（越先执行）
const PLUGIN_DEFAULT_PRIORITY: ReadonlyArray<PluginPriorityItem> = [
  { name: 'useReadyPlugin', priority: 10 },
  { name: 'useCachePlugin', priority: 20 },
  { name: 'useLoadingDelayPlugin', priority: 30 },
  { name: 'useDebouncePlugin', priority: 40 },
  { name: 'useThrottlePlugin', priority: 50 },
  { name: 'usePollingPlugin', priority: 60 },
  { name: 'useRetryPlugin', priority: 70 },
  { name: 'useWindowVisibilityChangePlugin', priority: 90 },
] as const;

// 使用全局对象存储状态，确保打包后所有模块共享同一个实例
const GLOBAL_PLUGIN_STATE_KEY = '__YM_USE_REQUEST_PLUGIN_STATE__';

interface PluginState {
  pluginPriorityMap: Map<string, number>;
  globalPlugins: Plugin<any, any[]>[];
  sortedBasePlugins: Plugin<any, any[]>[];
  BASE_PLUGINS: Plugin<any, any[]>[];
}

// 扩展 globalThis 类型
declare global {
  // eslint-disable-next-line no-var
  var __YM_USE_REQUEST_PLUGIN_STATE__: PluginState | undefined;
}

function getPluginState(): PluginState {
  if (!globalThis[GLOBAL_PLUGIN_STATE_KEY]) {
    globalThis[GLOBAL_PLUGIN_STATE_KEY] = {
      pluginPriorityMap: new Map<string, number>(),
      globalPlugins: [],
      sortedBasePlugins: [],
      BASE_PLUGINS: [],
    };
  }
  return globalThis[GLOBAL_PLUGIN_STATE_KEY]!;
}

export function setBasePlugins(plugins: Plugin<any, any[]>[]): void {
  getPluginState().BASE_PLUGINS = plugins;
}

// 初始化优先级映射
export function initializePluginPriorityMap() {
  const state = getPluginState();
  state.pluginPriorityMap = new Map(PLUGIN_DEFAULT_PRIORITY.map((item) => [item.name, item.priority]));
}

// 对插件列表进行排序（从小到大）
export function sortPlugins(plugins: Plugin<any, any[]>[]): Plugin<any, any[]>[] {
  const state = getPluginState();
  return [...plugins].sort((a, b) => {
    const priorityA = state.pluginPriorityMap.get(a.name) || 0;
    const priorityB = state.pluginPriorityMap.get(b.name) || 0;
    return priorityA - priorityB;
  });
}

// 更新基础插件排序
export function updateBasePluginsSort() {
  const state = getPluginState();
  state.sortedBasePlugins = sortPlugins(state.BASE_PLUGINS);
}

// 为插件设置优先级（如果没有设置）
export function ensurePluginPriority(plugins: Plugin<any, any[]>[]): void {
  const state = getPluginState();
  plugins.forEach((plugin) => {
    if (!state.pluginPriorityMap.has(plugin.name)) {
      const maxPriority = Math.max(...state.pluginPriorityMap.values(), 0) + 10;
      state.pluginPriorityMap.set(plugin.name, maxPriority);
    }
  });
}

// 定义全局插件和优先级
export function definePlugins(plugins: Plugin<any, any[]>[] = [], priorityItems: PluginPriorityItem[] = []) {
  const state = getPluginState();
  priorityItems.forEach((item) => {
    state.pluginPriorityMap.set(item.name, item.priority);
  });

  state.globalPlugins = plugins || [];

  ensurePluginPriority(state.globalPlugins);

  updateBasePluginsSort();
}

// 获取排序后的插件列表（包含自定义插件）
export function getSortedPlugins(customPlugins: Plugin<any, any[]>[] = []): Plugin<any, any[]>[] {
  ensurePluginPriority(customPlugins);

  const state = getPluginState();
  const allPluginsMap = new Map<string, Plugin<any, any[]>>();

  [...state.sortedBasePlugins, ...state.globalPlugins, ...customPlugins].forEach((plugin) => {
    allPluginsMap.set(plugin.name, plugin);
  });

  const uniquePlugins = Array.from(allPluginsMap.values());

  return sortPlugins(uniquePlugins);
}

export function getPluginPriorityMap(): Map<string, number> {
  return getPluginState().pluginPriorityMap;
}

export function getGlobalPlugins(): Plugin<any, any[]>[] {
  return getPluginState().globalPlugins;
}

export function getSortedBasePlugins(): Plugin<any, any[]>[] {
  return getPluginState().sortedBasePlugins;
}
