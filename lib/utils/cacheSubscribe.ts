type Listener = (data: any) => void;

// 使用全局对象存储 listeners，确保打包后所有模块共享同一个实例
const GLOBAL_LISTENERS_KEY = '__YM_USE_REQUEST_LISTENERS__';

// 扩展 globalThis 类型
declare global {
  // eslint-disable-next-line no-var
  var __YM_USE_REQUEST_LISTENERS__: Record<string, Listener[]> | undefined;
}

function getListeners(): Record<string, Listener[]> {
  if (!globalThis[GLOBAL_LISTENERS_KEY]) {
    globalThis[GLOBAL_LISTENERS_KEY] = {};
  }
  return globalThis[GLOBAL_LISTENERS_KEY]!;
}

export const trigger = (key: string, data: any) => {
  const listeners = getListeners();
  if (listeners[key]) {
    listeners[key].forEach((item) => item(data));
  }
};

export const subscribe = (key: string, listener: Listener) => {
  const listeners = getListeners();
  if (!listeners[key]) {
    listeners[key] = [];
  }
  listeners[key].push(listener);

  return () => {
    const index = listeners[key].indexOf(listener);
    listeners[key].splice(index, 1);
  };
};
