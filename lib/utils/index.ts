import { unref } from 'vue';
import type { Params } from '../type';
import type { Type, IsType } from './type';

export function useDelay(fn: Function, delay?: number) {
  if (delay) {
    return setTimeout(() => {
      fn();
    }, delay);
  } else {
    fn();
  }
}

export const isNonZeroFalsy = (value: any) => {
  return !isNumber(value) && !value;
};

export const unrefParms = <P extends any[]>(value: Params<P>): P => {
  let _value = unref(value);
  _value = TypeChecker.isArray(_value) ? _value : [_value];
  return _value;
};

export const composeMiddleware = (middleArray: any[], hook: any) => {
  return () => {
    let next = hook;
    for (let i = middleArray.length; i-- > 0; ) {
      next = middleArray[i]!(next);
    }
    return next();
  };
};

export const isType = function (o: any): IsType {
  const s = Object.prototype.toString.call(o);
  // @ts-ignore
  return s.match(/\[object (.*?)\]/)[1].toLowerCase();
};

export const isNull = (v: any) => isType(v) === 'null';
export const isUndefined = (v: any) => isType(v) === 'undefined';
export const isObject = (v: any) => isType(v) === 'object';
export const isArray = (v: any) => isType(v) === 'array';
export const isString = (v: any) => isType(v) === 'string';
export const isNumber = (v: any) => isType(v) === 'number';
export const isBoolean = (v: any) => isType(v) === 'boolean';
export const isFunction = (v: any) => isType(v) === 'function';
export const isRegExp = (v: any) => isType(v) === 'regexp';
export const isPromise = (v: any) => Boolean(v && typeof v.then === 'function');

export const TypeChecker: Type = {
  isNull,
  isUndefined,
  isObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isRegExp,
  isPromise,
};

export function limit(fn: any, timespan: number) {
  let pending = false;
  return (...args: any[]) => {
    if (pending) return;
    pending = true;
    fn(...args);
    setTimeout(() => {
      pending = false;
    }, timespan);
  };
}
