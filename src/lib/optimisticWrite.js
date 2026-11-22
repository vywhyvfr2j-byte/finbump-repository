// Optimistic list writes.
//
// A flow that awaited the server before showing the change made a tap feel like
// nothing happened on a slow connection. With this, the list updates the moment
// the user acts, the write runs behind it, and a failure puts the list back
// exactly as the user last saw it and reports why.
//
// `prev` is the list captured at call time; `next` is what the user should see.
// `onSuccess` receives whatever the write resolved with, so a create can swap
// its temporary row for the stored record.
export async function optimisticWrite({ setItems, prev, next, write, onSuccess, onError }) {
  setItems(next);
  try {
    const result = await write();
    onSuccess?.(result);
    return result;
  } catch (err) {
    setItems(prev);
    onError?.(err);
    return null;
  }
}