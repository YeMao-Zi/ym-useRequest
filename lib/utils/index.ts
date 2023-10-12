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

export const composeMiddleware = (middleArray: any[], hook: any) => {
  return () => {
    let next = hook;
    for (let i = middleArray.length; i-- > 0; ) {
      next = middleArray[i]!(next);
    }
    return next();
  };
};

export const type = function (o: any): Type {
  const s = Object.prototype.toString.call(o);
  return s.match(/\[object (.*?)\]/)[1].toLowerCase();
};

export const isNull = (v: any) => type(v) === 'null';
export const isUndefined = (v: any) => type(v) === 'undefined';
export const isObject = (v: any) => type(v) === 'object';
export const isArray = (v: any) => type(v) === 'array';
export const isString = (v: any) => type(v) === 'string';
export const isNumber = (v: any) => type(v) === 'number';
export const isBoolean = (v: any) => type(v) === 'boolean';
export const isFunction = (v: any) => type(v) === 'function';
export const isRegExp = (v: any) => type(v) === 'regexp';
export const isPromise = (v: any) => Boolean(v && typeof v.then === 'function');

export const isType: IsType = {
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
