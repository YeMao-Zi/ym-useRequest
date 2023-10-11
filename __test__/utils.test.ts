import { expect, test } from 'vitest';
import { composeMiddleware } from '../lib/utils';

test('composeMiddleware', async () => {
  let data: any[] = [];
  function fn1(serve:Function) {
    data.push(1);
    return serve;
  }
  function fn2(serve:Function) {
    data.push(2);
    return serve;
  }
  function serve() {
    data.push('serve');
  }
  const arr = [fn1, fn2];
  composeMiddleware(arr, serve)();
  expect(data).toEqual([2,1,'serve']);
});
