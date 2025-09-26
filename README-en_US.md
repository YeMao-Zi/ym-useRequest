![NPM Version](https://img.shields.io/npm/v/ym-userequest)
[![codecov](https://codecov.io/gh/YeMao-Zi/ym-useRequest/graph/badge.svg?token=PELX6B0U8F)](https://codecov.io/gh/YeMao-Zi/ym-useRequest)

English | [简体中文](README.md)

## Introduction

A manual management tool for interfaces.

## Installation

npm install ym-userequest

## Usage

<!-- TOC -->

- [Manual Execution](#manual-execution)
- [Automatic Execution with Default Parameters](#automatic-execution-with-default-parameters)
- [Cancel response](#cancel-response)
- [Reactive Data Monitoring and Automatic Updates](#reactive-data-monitoring-and-automatic-updates)
- [Delayed Loading](#delayed-loading)
- [Modify Data](#modify-data)
  - [defaultData](#defaultdata)
  - [wrappedPromise](#wrappedpromise)
  - [mutate](#mutate)
- [Polling](#polling)
  - [Polling error retry](#polling-error-retry)
  - [Polling Count](#polling-count)
- [Allow Request](#allow-request)
- [Debounce](#debounce)
- [Throttle](#throttle)
- [Cache](#cache)
- [Error Retry](#error-retry)
- [requestTick](#requesttick)
- [Monitor Browser Page Switching](#monitor-browser-page-switching)
- [Get Specified useRequest Instance](#get-specified-userequest-instance)
- [Custom Plugins](#custom-plugins)
  - [UseReadyPlugin](#usereadyplugin)
  - [Plugin for canceling Fetch requests](#plugin-for-canceling-fetch-requests)
- [middleware](#middleware)
- [Global Config](#global-config)
- [All Configuration Options](#all-configuration-options)
- [All Returned Properties](#all-returned-properties)
<!-- /TOC -->

### Manual Execution

```ts
import { useRequest } from 'ym-userequest';
const { data, params, loading, run, runAsync, refresh, refreshAsync, cancel } = useRequest(somePromise, {
  manual: true,
});
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve('success');
  });
};
run(); // Manually trigger once
// runAsync(); // Same as run, but returns a promise
// refresh(); // Re-request with previous parameters
// refreshAsync(); // Same as refresh, but returns a promise
// cancel(); // Cancel the request
```

### Automatic Execution with Default Parameters

```ts
// Multi-parameter request
const somePromise1 = (params1, params2) => {
  return new Promise((resolve, reject) => {
    resolve({ params1, params2 });
  });
};
const { data, loading } = useRequest(somePromise1, {
  defaultParams: ['params1', 'params2'],
});

// Single-parameter request
const somePromise2 = (params1) => {
  return new Promise((resolve, reject) => {
    resolve({ params1 });
  });
};
const { data, loading } = useRequest(somePromise2, {
  defaultParams: 'params1', // or ['params1']
});
```

> When defaultParams is passed as an array, it represents multiple parameters of the function. If you want to pass a single parameter that is itself an array, use [array].

### Cancel response

```ts
const request = () =>
  fetch('https://xxx...', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  });
const { data, cancel } = useRequestI(request);
cancel();
```

> When cancel is called, it merely ignores the current request and does not interrupt the requests that are being made. If you want to truly interrupt the request, you can do it yourself,refer to the custom plugin below.

### Reactive Data Monitoring and Automatic Updates

```ts
const pages = reactive({
  size: 1,
});
const somePromise = (number: number): Promise<any[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Array(number).fill(1));
    }, 1000);
  });
};

const refreshDepsParams = computed(() => pages.size);

const { data, refresh, loading } = useRequest(somePromise, {
  defaultParams: pages.size,
  refreshDeps: [() => pages.size], // Dependencies to monitor
  // Optional: Parameters to execute after dependency changes. If not provided, `refresh` is executed after dependency changes.
  // If it's a function, the function will be executed and its return value will be used as the parameter.
  refreshDepsParams: refreshDepsParams,
  // To avoid immediate requests after monitoring, pass a function with no return value.
  // refreshDepsParams: () => {},
});
const onClick = () => {
  pages.size++;
};
```

### Delayed Loading

Use loadingDelay to define a delay time for loading to avoid flickering when requests are short.

```ts
const somePromise = (params) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(params);
    }, 300);
  });
};
const { data, loading } = useRequest(somePromise, {
  defaultParams: ['params1'],
  loadingDelay: 1000, // Loading state won't change within 1s
});
```

### Modify Data

#### defaultData

Since data is a ref, it cannot be destructured with a default value. Use defaultData to set the default value.

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, loading, mutate } = useRequest(somePromise, {
  manual: true,
  defaultData: 3, // Returns data: Ref<3>
  // defaultData: shallowRef<3>, // Returns data: ShallowRef<3>
});
```

#### wrappedPromise

The return value is changed by wrapping the request, and the type of the return value is also changed accordingly.

```ts
import { wrappedPromise } from 'ym-userequest';

const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};
const { data, loading, mutate, requestTick } = useRequest(
  wrappedPromise(somePromise, (result, params) => {
    return { value: result };
  }),
);
requestTick(() => {
  console.log(data.value); // {value:1}
});
```

#### mutate

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, loading, mutate } = useRequest(somePromise, { manual: true });

mutate(5555);
console.log(data.value); // 5555

const onChange = () => {
  mutate((res) => {
    return res + 1;
  });
};

onChange();
console.log(data.value); // 2
```

### Polling

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};
// Request every 3000 ms
const { data, run, cancel } = useRequest(somePromise, {
  pollingInterval: 3000,
});

const onRun = () => {
  run(); // Continue polling
};

const onCancel = () => {
  cancel(); // Stop polling
};
```

#### Polling error retry

```ts
const errPromise = () => {
  return new Promise((resolve, reject) => {
    reject('error');
  });
};
const { data, run, cancel } = useRequest(errPromise, {
  pollingInterval: 3000,
  pollingErrorRetryCount: 3, // Retry on error. Polling will stop after 3 attempts.
});
```

#### Polling Count

After a cancel, the polling count is reset.

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};
const { cancel, pollingCount } = useRequest(somePromise, {
  pollingInterval: 100,
  onFinally() {
    if (pollingCount.value === 3) {
      cancel();
    }
  },
});
```

### Allow Request

The ready parameter controls whether the request is allowed. If ready is false, the request will never be allowed.

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const ready = ref(false);
const { data, run } = useRequest(somePromise, {
  ready,
  // or ready:()=> ready.value,
});
console.log(data.value); // null
ready.value = true;
run();
console.log(data.value); // 1
```

### Debounce

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, run } = useRequest(somePromise, {
  manual: true,
  debounceWait: 2000,
  debounceOptions: {
    // Parameters are the same as lodash's debounce
    leading: true,
    trailing: false,
  },
});

const onRun = () => {
  run();
};
```

### Throttle

```ts
const somePromise = () => {
  return new Promise((resolve, reject) => {
    resolve(1);
  });
};

const { data, run } = useRequest(somePromise, {
  manual: true,
  throttleWait: 2000,
  throttleOptions: {
    // Parameters are the same as lodash's throttle
    leading: true,
    trailing: false,
  },
});

const onRun = () => {
  run();
};
```

### Cache

> When cacheKey is set, the component will first return cached content on the second load, then re-initiate the request in the background.

```ts
import { useRequest, clearCache } from 'ym-userequest';
const somePromise = (value) => {
  return new Promise((resolve, reject) => {
    resolve(value);
  });
};

const { data, run } = useRequest(somePromise, {
  manual: true,
  cacheKey: 'test',
  cacheTime: 5000,
  staleTime: -1,
  // Custom cache setter
  // setCache(cacheKey, data) {
  //   localStorage.setItem(cacheKey, JSON.stringify(data));
  // },
  // Custom cache getter
  // getCache(cacheKey) {
  //   return JSON.parse(localStorage.getItem(cacheKey) || 'null');
  // },
});

run(1); // 1
run(2); // 1

// Manually clear cache: clearCache(params?: string[] | string)
// clearCache()

setTimeOut(() => {
  run(2);
  console.log(data.value); // 2
}, 5000);
```

### Error Retry

Retry the request after a failure.

```ts
const errorPromise = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('error');
    }, 1000);
  });
};
let count = 0;
const { data } = useRequest(errorPromise, {
  retryCount: 3,
  // retryInterval: 1000,
  onError() {
    count += 1;
    console.log(count);
  },
});

// count: 1
// count: 2
// count: 3
// count: 4
```

### requestTick

Execute a callback after the request completes.

```ts
const getData = (value = 1, time = 1000): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, time);
  });
};

const { data, run: run1, requestTick } = useRequest(() => getData(3), { manual: true });
const { run: run2 } = useRequest(getData, { manual: true });
const runAll = async () => {
  run1();
  run2();
  console.log(data.value); // undefined
  await requestTick(() => {
    console.log(data.value); // 3
  });
  console.log(data.value); // 3
};
runAll();
```

### Monitor Browser Page Switching

```ts
useRequest(getData, {
  // Re-initiate the request when the browser page is re-displayed
  refreshOnWindowFocus: true,
  // Do not re-request within 1000ms
  focusTimespan: 1000,
  // Cancel the request when leaving the browser page
  cancelOnWindowBlur: true,
});
```

### Get Specified useRequest Instance

It can be applied to different components to obtain the specified useRequest instance

```ts
import { useRequest, getRequest } from 'ym-request';
const instance1 = useRequest(getData, {
  id: 'getData',
  manual: true,
});
instance1.run(2);

const instance2 = getRequest('getData');

console.log(instance1.data, instance2.data); // 2, 2
instance2.run(3);

console.log(instance1.data, instance2.data); // 3, 3
```

### Custom Plugins

In instance, you can access all returned properties.

In options, you can access all configuration options.

In the plugin's returned object, if onBefore returns returnNow: true, the request will not be initiated. returnData will be returned as the data.

onInit can be used to modify the request.

Other functions such as onSuccess correspond to various times of the request

#### useReadyPlugin

```ts
import { definePlugins, TypeChecker, Plugin } from 'ym-userequest';
import { Ref, unref } from 'vue';

const useReadyPlugin: Plugin<any, any[]> = (instance, options) => {
  const { ready = true } = options;
  return {
    onBefore() {
      const _ready = TypeChecker.isFunction(ready) ? (ready as () => boolean | Ref<boolean>)() : ready;
      if (!unref(_ready)) {
        instance.loading.value = false;
        return {
          returnNow: true,
          // returnData: instance.data.value,
        };
      }
    },
    // All return signatures, corresponding to useRequest callbacks
    // onBefore: (params: P) => onBeforePlugin | void;
    // onInit: (service: (...args: P) => Promise<R>) => { servicePromise: Promise<R> },
    // onSuccess(data: R, params: P): void,
    // onError(error: Error, params: P): void,
    // onFinally(params: P, data: R, error: Error): void,
    // onCancel(): void,
    // onMutate(data: R): void,
  };
};

// Register
definePlugins([useReadyPlugin]);
```

#### Plugin for canceling Fetch requests

plugin

```ts
// useFetchCancelPlugin.ts
import { type Plugin } from 'ym-userequest';

export const useFetchCancelPlugin: Plugin<any, any[]> = (instance, { controller }) => {
  if (!controller) {
    return {};
  }

  let currentController = new AbortController();

  return {
    onBefore() {
      if (currentController.signal.aborted) {
        currentController = new AbortController();
      }
    },

    onInit(service) {
      return {
        servicePromise: service(...instance.params.value, currentController.signal),
      };
    },

    onCancel() {
      currentController.abort();
    },
  };
};
```

register

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { useFetchCancelPlugin } from './useFetchCancelPlugin';
import { definePlugins } from 'ym-userequest';

definePlugins([useFetchCancelPlugin]);
const app = createApp(App);

app.mount('#app');
```

use

```ts
import { useRequest } from 'ym-userequest';
const request = (params: any, signal?: AbortSignal) =>
  fetch('https://httpbin.org/delay/3', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  });

const { data, loading, status, cancel, run } = useRequest(request, {
  manual: true,
  controller: true,
  onCancel() {
    console.log('onCancel');
  },
});
run(123);
setTimeout(() => {
  cancel();
}, 1000);
```

### middleware

```ts
const logs: string[] = [];
const logger1 = (useRequestNext: any) => {
  return (service: any, options: any, plugins: any) => {
    logs.push('logger1 enter');
    const extendedService = (...args: any[]) => {
      logs.push('logger1 service');
      return service(...args);
    };
    const next = useRequestNext(extendedService, options, plugins);
    logs.push('logger1 exit');
    return next;
  };
};

const logger2 = (useRequestNext: any) => {
  return (service: any, options: any, plugins: any) => {
    logs.push('logger2 enter');
    const extendedService = (...args: any[]) => {
      logs.push('logger2 service');
      return service(...args);
    };
    const next = useRequestNext(extendedService, options, plugins);
    logs.push('logger2 exit');
    return next;
  };
};

useRequest(getData, {
  manual: true,
  use: [logger1, logger2],
});

run();
// logs: ['logger1 enter', 'logger2 enter', 'logger2 exit', 'logger1 exit', 'logger2 service', 'logger1 service'];
```

## Global Config 

When using in a component, the default options for useRequest of that component and its child components will be the options passed to useRequestConfig.

```ts
useRequestConfig({ manual: true });
```

## All Configuration Options

```ts
{
  // Whether to manually initiate the request
  manual?: boolean;

  // Set default data, can also be used to specify data as ShallowRef or Ref
  // If the passed value is non-reactive, it will be converted to a ref
  defaultData?: R | Ref<R>;

  // Default parameters for automatic execution when manual is false
  defaultParams?: Params<P>;

  // Dependencies to monitor
  refreshDeps?: WatchSource<any>[] | WatchSource<any>;
  // Parameters to execute after dependency changes. If it's a function, it will be executed, and its return value will be used as the parameter for the request.
  refreshDepsParams?: Params<P> | ((value: P, oldValue: P) => void | Params<P>);

  // Request delay
  loadingDelay?: number;

  // Polling
  pollingInterval?: Ref<number> | number;
  // Polling error retry
  pollingErrorRetryCount?: number;

  // Error retry count
  retryCount?: number;
  // Retry interval
  // If not set, a simple exponential backoff algorithm is used: 1000 * 2 ** retryCount,
  // e.g., first retry waits 2s, second waits 4s, etc., capped at 30s.
  retryInterval?: number;

  // Whether to allow the request (changes do not trigger automatic requests)
  ready?: (() => Ref<boolean> | boolean) | (Ref<boolean> | boolean);

  // Debounce wait time
  debounceWait?: number;
  // Debounce function properties
  debounceOptions?: {
    // Whether to execute before the delay starts
    leading?: boolean;
    // Whether to execute after the delay starts
    trailing?: boolean;
    // Maximum allowed delay
    maxWait?: number;
  };

  // Throttle wait time
  throttleWait?: number;
  // Throttle function properties
  throttleOptions?: {
    // Whether to execute before the delay starts
    leading?: boolean;
    // Whether to execute after the delay starts
    trailing?: boolean;
  };

  // Unique identifier for the cache
  cacheKey?: string | ((params?: P) => string);
  // Cache time, default: 5 * 60 * 1000
  // Cache will be cleared after this time
  // Note: When cache expires, a new request will be made regardless of staleTime
  cacheTime?: number;
  // Freshness time for cached data (when to re-request to update cache), default: 0, -1 means never re-request
  staleTime?: number;
  // Custom cache getter
  getCache?: (cacheKey: string) => CacheData;
  // Custom cache setter
  setCache?: (cacheKey: string, cacheData: CacheData) => void;
  // Whether to re-initiate the request when the browser page is re-displayed
  refreshOnWindowFocus?: Ref<boolean> | boolean;
  // Re-request interval in milliseconds, default: 5000
  focusTimespan?: Ref<number> | number;
  // Whether to cancel the request when leaving the browser page
  cancelOnWindowBlur?: Ref<boolean> | boolean;
  // Callback when cache is retrieved
  onCache?: (response: R) => void;
  // Pre-request callback
  onBefore?: (params: P) => void;
  // Callback executed when each request is made, can access the response of each request
  onRequest?: ({ params, response, error, abort }: { params: P; response: R; error: any; abort: boolean }) => void;
  // Success callback (data is updated after this callback)
  onSuccess?: (response: R, params: P) => MaybePromise<void | R>;
  // Error callback
  onError?: (err: any, params: P) => void;
  // Request completion callback
  onFinally?: () => void;
  // Callback when the current Promise is ignored
  onCancel?: () => void;
  // middleware
  use?: UseRequestMiddleware<R, P>[];
}
```

## All Returned Properties

```ts
{
  // Data returned after the request succeeds
  data: Ref<R>;
  // Request execution status
  loading: Ref<boolean>;
  // Error information if the request fails
  error?: Ref<any>;
  // Parameters of the current request
  params?: Ref<P>;
  // Cumulative polling count during polling
  pollingCount: Ref<number>;
  // Manually execute the request (returns a promise)
  runAsync: (...arg: P) => Promise<R>;
  // Manually execute the request
  run: (...arg: P) => void;
  // Ignore the current Promise's response
  cancel: () => void;
  // Manually refresh the request
  refresh: () => void;
  // Manually refresh the request (returns a promise)
  refreshAsync: () => Promise<R>;
  // Modify the returned data
  mutate: (newData: R) => void | (arg: (oldData: R) => R) => void;
  // Data processing status, default: undefined (not requested yet)
  status: Ref<'pending' | 'settled'>;
  // Wait for the request to complete
   requestTick: (callback?: (context: { params: P; data: R }) => void) => Promise<{ params: P; data: R }>;

}
```
