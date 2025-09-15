import type { Service, Options, Request, Plugin } from './type';
import { setRequest, getRequest } from './requestMap';
import debounce from './utils/debounce';
import throttle from './utils/throttle';
import { TypeChecker, wrappedPromise } from './utils/index';
import { clearCache, setCache, getCache } from './utils/cache';
import { trigger } from './utils/cacheSubscribe';
import usePlugins from './usePlugins';
import useLoadingDelayPlugins from './plugins/useLoadingDelayPlugin';
import usePollingPlugin from './plugins/usePollingPlugin';
import useReadyPlugin from './plugins/useReadyPlugin';
import useRefreshDepsPlugin from './plugins/useRefreshDepsPlugin';
import useDebouncePlugin from './plugins/useDebouncePlugin';
import useThrottlePlugin from './plugins/useThrottlePlugin';
import useCachePlugin from './plugins/useCachePlugin';
import useRetryPlugin from './plugins/useRetryPlugin';
import useWindowVisibilityChangePlugin from './plugins/useWindowVisibilityChangePlugin';

interface PluginPriorityItem {
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

// 基础插件列表
const BASE_PLUGINS = [
  useReadyPlugin,
  useCachePlugin,
  useLoadingDelayPlugins,
  useDebouncePlugin,
  useThrottlePlugin,
  usePollingPlugin,
  useRetryPlugin,
  useRefreshDepsPlugin,
  useWindowVisibilityChangePlugin,
];

// 全局状态
let pluginPriorityMap: Map<string, number>;
let globalPlugins: Plugin<any, any[]>[] = [];
let sortedBasePlugins: Plugin<any, any[]>[] = [];

// 初始化优先级映射
function initializePluginPriorityMap() {
  pluginPriorityMap = new Map(PLUGIN_DEFAULT_PRIORITY.map((item) => [item.name, item.priority]));
}

// 对插件列表进行排序（从小到大）
function sortPlugins(plugins: Plugin<any, any[]>[]): Plugin<any, any[]>[] {
  return [...plugins].sort((a, b) => {
    const priorityA = pluginPriorityMap.get(a.name) || 0;
    const priorityB = pluginPriorityMap.get(b.name) || 0;
    return priorityA - priorityB; // 从小到大排序
  });
}

// 更新基础插件排序
function updateBasePluginsSort() {
  sortedBasePlugins = sortPlugins(BASE_PLUGINS);
}

// 为插件设置优先级（如果没有设置）
function ensurePluginPriority(plugins: Plugin<any, any[]>[]): void {
  plugins.forEach((plugin) => {
    if (!pluginPriorityMap.has(plugin.name)) {
      const maxPriority = Math.max(...pluginPriorityMap.values(), 0) + 10;
      pluginPriorityMap.set(plugin.name, maxPriority);
    }
  });
}

// 定义全局插件和优先级
function definePlugins(plugins: Plugin<any, any[]>[] = [], priorityItems: PluginPriorityItem[] = []) {
  // 更新优先级映射
  priorityItems.forEach((item) => {
    pluginPriorityMap.set(item.name, item.priority);
  });

  // 更新全局插件
  globalPlugins = plugins || [];

  // 为新增插件设置优先级
  ensurePluginPriority(globalPlugins);

  updateBasePluginsSort();
}

// 获取排序后的插件列表（包含自定义插件）
function getSortedPlugins(customPlugins: Plugin<any, any[]>[] = []): Plugin<any, any[]>[] {
  // 为自定义插件设置优先级
  ensurePluginPriority(customPlugins);

  // 合并所有插件并去重（保留最后一个出现的同名插件）
  const allPluginsMap = new Map<string, Plugin<any, any[]>>();

  // 按顺序添加，后面的会覆盖前面的同名插件
  [...sortedBasePlugins, ...globalPlugins, ...customPlugins].forEach((plugin) => {
    allPluginsMap.set(plugin.name, plugin);
  });

  const uniquePlugins = Array.from(allPluginsMap.values());

  return sortPlugins(uniquePlugins);
}

function useRequest<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options?: Options<R, P>,
  plugins?: Plugin<R, P>[],
): Request<R, P> {
  // 获取排序后的插件列表（从小到大）
  const sortedPlugins = getSortedPlugins(plugins);

  // 调用 usePlugins 并传入排序后的插件
  const requestInstance = usePlugins<R, P>(service, options, sortedPlugins);

  if (options?.id) {
    setRequest(options.id, requestInstance);
  }

  return requestInstance;
}

// 初始化
initializePluginPriorityMap();
updateBasePluginsSort();

export {
  useRequest,
  getRequest,
  clearCache,
  setCache,
  getCache,
  trigger,
  debounce,
  throttle,
  definePlugins,
  wrappedPromise,
  TypeChecker,
};

export type * from './type';
