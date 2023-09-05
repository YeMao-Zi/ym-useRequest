import { expect, test } from 'vitest'
import useRequest from '../lib';

const getData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, 1000);
  });
};

test('dataChange', (done) => {
  useRequest(getData,{
    onSuccess(data){
      expect(data).toBe(3)
      // done()
    }
  })
});
