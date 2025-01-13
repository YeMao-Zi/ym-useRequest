// from swr
type Listener = () => void;

const refreshListeners: Listener[] = [];
const cancelListeners: Listener[] = [];

export function refreshSubscribe(listener: Listener) {
  refreshListeners.push(listener);
  return function unsubscribe() {
    const index = refreshListeners.indexOf(listener);
    if (index > -1) {
      refreshListeners.splice(index, 1);
    }
  };
}

export function cancelSubscribe(listener: Listener) {
  cancelListeners.push(listener);
  return function unsubscribe() {
    const index = cancelListeners.indexOf(listener);
    if (index > -1) {
      cancelListeners.splice(index, 1);
    }
  };
}

if (window?.document) {
  const revalidate = () => {
    if (document.visibilityState === 'visible') {
      for (let i = 0; i < refreshListeners.length; i++) {
        const listener = refreshListeners[i];
        listener();
      }
    } else {
      for (let i = 0; i < cancelListeners.length; i++) {
        const listener = cancelListeners[i];
        listener();
      }
    }
  };
  window.addEventListener('visibilitychange', revalidate, false);
}
