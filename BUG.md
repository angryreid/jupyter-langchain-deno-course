# BUG

1. ReadableStream is not defined

```sh
class IterableReadableStream extends ReadableStream {
                                     ^
ReferenceError: ReadableStream is not defined
```

**Fix** due to node js version is too low.
