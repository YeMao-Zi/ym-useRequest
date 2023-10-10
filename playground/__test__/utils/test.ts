export const testFn = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('请求成功');
    }, 1000);
  });
};
