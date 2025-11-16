/**
 * 简单的响应式系统，替代 Vue 的 ref/reactive
 */

export interface Ref<T> {
  value: T;
}

/**
 * 创建一个响应式引用
 */
export function ref<T>(value?: T): Ref<T> {
  return { value };
}

/**
 * 创建一个浅层响应式引用
 */
export function shallowRef<T>(value?: T): Ref<T> {
  return { value };
}

/**
 * 判断是否为 ref
 */
export function isRef<T>(value: any): value is Ref<T> {
  return value && typeof value === 'object' && 'value' in value;
}

/**
 * 解引用，如果是 ref 则返回 value，否则返回原值
 */
export function unref<T>(value: T | Ref<T>): T {
  return isRef(value) ? value.value : value;
}

/**
 * 简单的计算属性实现
 */
export function computed<T>(getter: () => T): Ref<T> {
  const result = ref(getter()) as Ref<T>;
  // 注意：无 Vue 版本不支持自动更新，需要手动调用
  return result;
}

/**
 * 简单的 watch 实现（简化版，不支持深度监听和立即执行）
 */
export function watch<T>(
  source: T | (() => T) | Array<T | (() => T)>,
  callback: (newValue: T, oldValue: T) => void,
  options?: { deep?: boolean; immediate?: boolean },
) {
  let oldValue: T;
  let isFirst = true;

  const getValue = () => {
    if (Array.isArray(source)) {
      return source.map((s) => (typeof s === 'function' ? (s as () => T)() : s)) as unknown as T;
    }
    return typeof source === 'function' ? (source as () => T)() : source;
  };

  // 简化版：不支持自动监听，需要手动调用
  // 返回一个函数用于手动触发检查
  const check = () => {
    const newValue = getValue();
    if (isFirst) {
      oldValue = newValue;
      isFirst = false;
      if (options?.immediate) {
        callback(newValue, oldValue);
      }
    } else {
      // 简单的浅比较
      if (newValue !== oldValue) {
        callback(newValue, oldValue);
        oldValue = newValue;
      }
    }
  };

  // 初始化
  if (options?.immediate) {
    check();
  }

  return check;
}

/**
 * watchEffect 的简化实现
 * 返回一个清理函数和更新函数
 */
export function watchEffect(
  effect: (onCleanup: (cleanupFn: () => void) => void) => void,
): () => void {
  const cleanupFns: Array<() => void> = [];
  const onCleanup = (cleanupFn: () => void) => {
    cleanupFns.push(cleanupFn);
  };

  effect(onCleanup);

  return () => {
    cleanupFns.forEach((fn) => fn());
    cleanupFns.length = 0;
  };
}

