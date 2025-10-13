import { unref } from 'vue';
import type { Params } from '../type';

/**
 * 延迟执行函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 如果设置了延迟则返回 timeout ID，否则返回 undefined
 */
export function useDelay(fn: Function, delay?: number) {
  if (delay) {
    return setTimeout(() => {
      fn();
    }, delay);
  } else {
    fn();
  }
}

/**
 * 判断值是否为非零的假值
 * @param value 要检查的值
 * @returns 如果是非零假值返回 true，否则返回 false
 */
export const isNonZeroFalsy = (value: any): boolean => {
  return !TypeChecker.isNumber(value) && !value;
};

/**
 * 解引用参数
 * @param value 参数值
 * @returns 解引用后的参数数组
 */
export const unrefParms = <P extends any[]>(value: Params<P>): P => {
  const _value = unref(value);
  return TypeChecker.isArray(_value) ? _value : ([_value] as P);
};

/**
 * 获取可能为函数的值的结果
 * 如果传入的参数是函数，则执行该函数并返回结果；否则直接返回参数本身
 * @param target 可能为函数的未知类型参数
 * @returns 如果target是函数则返回函数执行结果，否则返回target本身
 */
export function getMayFunctionResult<T>(target: T | (() => T)): T {
  if (isFunction(target)) {
    return target();
  }
  return target;
}

const TYPE_MAP = {
  null: 'null',
  undefined: 'undefined',
  object: 'object',
  array: 'array',
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  function: 'function',
  regexp: 'regexp',
  date: 'date',
  error: 'error',
  symbol: 'symbol',
  bigint: 'bigint',
} as const;

type TypeName = keyof typeof TYPE_MAP;
type ActualType = (typeof TYPE_MAP)[TypeName];
/**
 * 获取值的精确类型
 */
export const getType = (o: unknown): ActualType => {
  const s = Object.prototype.toString.call(o);
  return s.match(/\[object (.*?)\]/)?.[1].toLowerCase() as ActualType;
};
/**
 * 类型检查函数工厂
 */
const createTypeChecker = <T>(expectedType: ActualType) => {
  return (v: unknown): v is T => getType(v) === expectedType;
};

// 具体类型检查函数
export const isNull = createTypeChecker<null>(TYPE_MAP.null);
export const isUndefined = createTypeChecker<undefined>(TYPE_MAP.undefined);
export const isObject = createTypeChecker<object>(TYPE_MAP.object);
export const isArray = createTypeChecker<unknown[]>(TYPE_MAP.array);
export const isString = createTypeChecker<string>(TYPE_MAP.string);
export const isNumber = createTypeChecker<number>(TYPE_MAP.number);
export const isBoolean = createTypeChecker<boolean>(TYPE_MAP.boolean);
export const isFunction = createTypeChecker<Function>(TYPE_MAP.function);
export const isRegExp = createTypeChecker<RegExp>(TYPE_MAP.regexp);
export const isDate = createTypeChecker<Date>(TYPE_MAP.date);
export const isError = createTypeChecker<Error>(TYPE_MAP.error);
export const isSymbol = createTypeChecker<symbol>(TYPE_MAP.symbol);
export const isBigInt = createTypeChecker<bigint>(TYPE_MAP.bigint);
export const isPromise = <T = any>(v: any): v is Promise<T> => Boolean(v && typeof v.then === 'function');
export const isEmpty = (v: unknown): boolean => {
  if (isNull(v) || isUndefined(v)) return true;
  if (isString(v) || isArray(v)) return v.length === 0;
  if (isObject(v)) return Object.keys(v).length === 0;
  if (isNumber(v)) return isNaN(v);
  return false;
};
/**
 * 类型检查器集合
 */
export const TypeChecker = {
  isNull,
  isUndefined,
  isObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isRegExp,
  isDate,
  isError,
  isSymbol,
  isBigInt,
  isPromise,
  isEmpty,
};

/**
 * 限制函数执行频率（节流）
 * @param fn 要限制的函数
 * @param timespan 时间间隔（毫秒）
 * @returns 限制后的函数
 */
export function limit<T extends (...args: any[]) => any>(fn: T, timespan: number): (...args: Parameters<T>) => void {
  let pending = false;
  return (...args: Parameters<T>) => {
    if (pending) return;
    pending = true;
    fn(...args);
    setTimeout(() => {
      pending = false;
    }, timespan);
  };
}

/**
 * 包装 Promise 函数
 * @param service 返回 Promise 的服务函数
 * @param call 处理结果的回调函数
 * @returns 包装后的异步函数
 */
export function wrappedPromise<T, R, P extends unknown[]>(
  service: (...args: P) => Promise<T>,
  call: (result: T, params: P) => R | Promise<R>,
) {
  return async (...args: P): Promise<R> => {
    const result = await service(...args);
    return call(result, args);
  };
}
