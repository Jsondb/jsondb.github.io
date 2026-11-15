---
title: The JsonDBTemplate
description: Creating a JsonDBTemplate, sharing one per database folder, and closing it.
sidebar:
  badge:
    text: New
    variant: tip
---

`io.jsondb.JsonDBTemplate` is the whole API. Each instance owns one database folder: it loads the collections in that folder into memory and writes every change back to their files.

## Creating one

There are two ways to tell JsonDB which classes are documents.

**Pass the classes directly** (new in 1.1.0). This is the recommended way, and the only one that works on [Android and under OSGi](/guides/android-osgi/):

```java
JsonDBTemplate db = new JsonDBTemplate("/path/to/db", Arrays.asList(User.class, Server.class));
```

**Scan a package.** JsonDB finds the `@Document` classes in the package:

```java
JsonDBTemplate db = new JsonDBTemplate("/path/to/db", "com.example.model");
```

Each form has variants that also take a cipher, for [encryption](/guides/encryption/), and two schema settings:

| Constructor | Use it for |
|---|---|
| `(String dbPath, Collection<Class<?>> classes)` | The common case. |
| `(String dbPath, Collection<Class<?>> classes, ICipher cipher)` | Encrypting `@Secret` fields. Pass `null` for no encryption. |
| `(String dbPath, Collection<Class<?>> classes, ICipher cipher, boolean compatibilityMode, Comparator<String> schemaComparator)` | Every setting. |
| `(String dbPath, String basePackage)` | Package scanning. |
| `(String dbPath, String basePackage, ICipher cipher)` | Package scanning with encryption. |
| `(String dbPath, String basePackage, boolean compatibilityMode, Comparator<String> schemaComparator)` | Package scanning with the schema settings. |
| `(String dbPath, String basePackage, ICipher cipher, boolean compatibilityMode, Comparator<String> schemaComparator)` | Package scanning with every setting. |

- **`compatibilityMode`**: when `true`, properties in the files that your classes don't have are ignored instead of causing an error. You need it to load a collection written with an older version of a class; see [Schema versions](/guides/schema-versions/). The default is `false`.
- **`schemaComparator`** decides whether a file's schema version matches the class's. Pass `null` for the default, which compares dotted numbers such as `1.0` and `1.10`.

The folder is created if it doesn't exist. Collections already in the folder are loaded when the template is created.

## One instance per folder

Create **one** `JsonDBTemplate` for each database folder, and share it.

- **It's thread-safe.** Every thread in your application can use the same instance.
- **Two instances on the same folder lose each other's writes.** Each one keeps its own copy of the data in memory and rewrites the files from that copy. Since 1.1.16, JsonDB logs a warning when a second instance opens a folder that another instance in the same JVM already has open:

  ```text
  WARN io.jsondb.JsonDBTemplate - JsonDB folder /path/to/db is already open by another
  JsonDBTemplate in this JVM (2 instances now). Instances on the same folder lose each
  other's writes: share one JsonDBTemplate between threads, or close() the other instance first.
  ```

In a dependency-injection framework, register the template as a singleton. Elsewhere, create it once at start-up and pass it to the code that needs it.

## Closing

`JsonDBTemplate` is `AutoCloseable` (new in 1.1.16). `close()` stops its file-change watcher, removes its JVM shutdown hook, and releases its hold on the folder, so another instance can then open it without the warning.

```java
try (JsonDBTemplate db = new JsonDBTemplate(dbPath, Arrays.asList(User.class))) {
  // use db
}
```

For a long-lived template, call `close()` when your application shuts down. Closing twice is harmless; don't use an instance after closing it.

Data is never waiting to be written: every write has already reached the file by the time the method returns. Closing releases resources; it doesn't flush anything.

## Reloading from disk

JsonDB assumes it's the only writer of its folder. If another program changes the files, reload them:

- `reLoadDB()` reloads every collection.
- `reloadCollection("users")` reloads one.

To reload automatically when files change, use a [file-change listener](/guides/file-change-listeners/).
