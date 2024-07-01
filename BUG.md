# BUG

## ReadableStream is not defined

```sh
class IterableReadableStream extends ReadableStream {
                                     ^
ReferenceError: ReadableStream is not defined
```

**Fix** Due to node js version is too low.

## ReferenceError: fetch is not defined

**Fix** Due to node js version is too low. Fetch API is newly support in Node *18*
