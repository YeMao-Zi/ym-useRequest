export type Type = {
  isNull: (v: any) => boolean;
  isUndefined: (v: any) => boolean;
  isObject: (v: any) => boolean;
  isArray: (v: any) => boolean;
  isString: (v: any) => boolean;
  isNumber: (v: any) => boolean;
  isBoolean: (v: any) => boolean;
  isFunction: (v: any) => boolean;
  isRegExp: (v: any) => boolean;
  isPromise: (v: any) => boolean;
};

export type IsType =
  | 'null'
  | 'undefined'
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'function'
  | 'regexp'
  | 'promise';
