---
title: The JsonDBTemplate
description: Creating a JsonDBTemplate, opening a folder on any file system or read-only, sharing one per folder, and closing it.
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

Every constructor that takes the folder as a `String` also has a version that takes a `java.nio.file.Path` (new in 1.1.93); see [A folder on any file system](#a-folder-on-any-file-system). Because of that, a literal `null` as the folder doesn't compile.

For the settings that have no constructor argument, such as [read-only mode](#opening-read-only), fill in a `JsonDBConfig` and pass it to `new JsonDBTemplate(config)` (new in 1.1.93). Its constructors take the same arguments as the template's.

The folder is created if it doesn't exist. Collections already in the folder are loaded when the template is created.

## A folder on any file system

A `Path` folder can be on any file system Java supports, not only the default one. For example, [Jimfs](https://github.com/google/jimfs) (a separate library, `com.google.jimfs:jimfs`) keeps the whole database in memory, which suits tests:

```java
FileSystem fs = Jimfs.newFileSystem(Configuration.unix());
JsonDBTemplate db = new JsonDBTemplate(fs.getPath("/db"), Arrays.asList(User.class));
```

Nothing is written to disk. [`backup()` and `restore()`](/guides/backup-restore/#between-file-systems) take a `Path` too, so you can copy a database between memory and disk.

## Opening read-only

To read a database without being able to change it, for example on a read-only mount or another application's data, open it read-only (new in 1.1.93):

```java
JsonDBConfig config = new JsonDBConfig("/path/to/db", Arrays.asList(User.class), null, false, null);
config.setReadOnly(true);
JsonDBTemplate db = new JsonDBTemplate(config);
```

The arguments after the class list are the cipher, `compatibilityMode` and the schema comparator, as for the [constructors](#creating-one). A read-only template doesn't create lock files, so the folder doesn't have to be writable. Reads, queries, `reLoadDB()` and [`backup()`](/guides/backup-restore/) work. Everything that would change the database throws `InvalidJsonDbApiUsageException`: `insert`, `save`, `upsert` and `remove`, the [find-and-modify and find-and-remove](/guides/find-and-modify/) methods, creating and dropping collections, schema updates, `changeEncryption()` and `restore()`. `isReadOnly()` tells you whether a template is read-only.

A folder JsonDB can't write to only opens this way. Opened normally, it fails with an `InvalidJsonDbApiUsageException` saying the folder isn't writable.

Read-only mode is about the whole template. It's separate from a [read-only collection](/guides/crud/#read-only-collections), which is one collection whose schema version doesn't match its class.

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

## Surviving a crash

JsonDB writes each change to a temporary file, forces that file to disk, and then renames it over the collection file. A crash or power loss part-way through leaves either the old file or the new one, never a partial one.

The rename itself can still be lost: after a power cut, a write that had already returned may be missing, with the file as it was before that write. If your application can't accept that, turn on folder syncing (new in 1.1.63):

```java
db.setSyncFolderOnWrite(true);
```

After every write, JsonDB then also forces the database folder to disk, so a write that has returned survives a crash. It makes writes several times slower, so it's off by default. Not every platform can sync a folder; Windows can't, and there the setting has no effect.

## Reloading from disk

JsonDB assumes it's the only writer of its folder. If another program changes the files, reload them:

- `reLoadDB()` reloads every collection.
- `reloadCollection("users")` reloads one.

To reload automatically when files change, use a [file-change listener](/guides/file-change-listeners/).
