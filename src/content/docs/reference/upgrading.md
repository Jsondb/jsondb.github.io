---
title: Upgrading
description: What to change, and what behaves differently, when moving from JsonDB 1.0.x or an earlier 1.1 release to 1.1.93.
---

1.1.0 was the first release since 1.0.115 in March 2020. Most code upgrades by changing the version number, but some behaviour has changed. Check this list, especially if you build queries from user input, use `findAndModify`, or migrate schemas.

## Dependency

Change the version to `1.1.93`. Drop any `-j8` or `-j11` suffix; one build now runs on Java 8 and later:

```diff lang="xml"
 <dependency>
   <groupId>io.jsondb</groupId>
   <artifactId>jsondb-core</artifactId>
-  <version>1.0.115-j11</version>
+  <version>1.1.93</version>
 </dependency>
```

commons-beanutils and commons-collections are no longer dependencies. If your own code used them through JsonDB, add them to your build yourself.

## Behaviour changes

### Queries can't call Java methods

JXPath "extension functions" are disabled, so a query that calls a Java method fails with a `JXPathException` (specifically `JXPathFunctionNotFoundException`) instead of running it. This closes a remote-code-execution hole in applications that build queries from input. Core XPath functions such as `contains()`, `not()` and `count()` still work. See [Security notes](/reference/security/).

### `findAndModify` and `findAllAndModify` are stricter

Updates are now converted with the same rules JsonDB uses to read its files. These are rejected with `InvalidJsonDbApiUsageException`:

- property names the class doesn't have;
- `null` for a primitive;
- lossy number conversions, such as `7.9` into an `int` or `long`;
- non-numeric strings for numbers;
- boolean strings other than `"true"` and `"false"`.

Enum names given as strings now work. Since 1.1.16, changing a document's `@Id` with an update is also rejected. See [Updating with findAndModify](/guides/find-and-modify/).

### `updateCollectionSchema` is safer

- `AddOperation` fills only documents where the property is missing or `null`. It no longer overwrites existing values.
- Updates that would lose data are rejected before anything is written.
- Renames keep their values, and several renames in one update all apply.

See [Schema versions](/guides/schema-versions/).

### Errors that used to be hidden now surface

- A collection file that exists but can't be parsed is left untouched. `getCollection()` and `createCollection()` throw `InvalidJsonDbApiUsageException` for it, instead of replacing it with an empty file.
- A write that can't be saved throws `JsonDBException` instead of appearing to succeed, and leaves the collection unchanged. This covers a failed final file move and, from 1.1.63, an unavailable lock or a temporary file that can't be created (in a folder that stops being writable while it's open, for example). The remove methods used to return `null` in those cases, as if nothing had matched.
- A `@Document` class without JsonDB's own `@Id`, for example one using `javax.persistence.Id`, fails with an `InvalidJsonDbApiUsageException` naming the class, instead of a `NullPointerException`.

### Quieter logging

Routine messages, such as "Encryption is enabled" and the backup and restore notices, are logged at `DEBUG` instead of `INFO`.

### Two templates on one folder now warn

JsonDB logs a warning when a second `JsonDBTemplate` opens a folder that's already open in the same JVM. The two instances lose each other's writes, so share one instance instead. See [One instance per folder](/guides/jsondbtemplate/#one-instance-per-folder).

## New things worth adopting

- **Pass entity classes** to the constructor instead of a package name. It's required on [Android and OSGi](/guides/android-osgi/), and it's simpler everywhere.
- **Close the template**, or use try-with-resources. Each template used to leak a file-watcher thread and a shutdown hook.
- **`count()`**, instead of `findAll(...).size()`.
- **[`backup()` and `restore()`](/guides/backup-restore/)** to and from zip files.
- **`remove(object)`** without the class argument.
- **[`setSyncFolderOnWrite(true)`](/guides/jsondbtemplate/#surviving-a-crash)**, if a write that has returned must survive a power cut.

## Bugs fixed

These fixes need no change to your code, but they may explain odd behaviour you worked around:

- A batch `upsert()` mixing new and existing documents silently dropped the updates.
- A collection file with one bad line could be emptied by a later `getCollection()`.
- A thread that lost the race to create a collection could hang it.
- Merge-restore encrypted `@Secret` fields twice on encrypted databases.
- Documents inserted without an id could be lost, and a batch of them failed with "Duplicate object with id: null" (fixed in 1.1.63).
- A crash shortly after a write could leave a collection file empty or partly written (fixed in 1.1.63).
- A misspelt collection name given to `insert`, `save`, `upsert` or `remove` threw a bare `NullPointerException` (fixed in 1.1.63).
- A file-change listener added after the last one was removed received no events (fixed in 1.1.63).

## From 1.1.63

Change the version to `1.1.93`. Check these changes:

- **A folder JsonDB can't write to no longer opens as an empty database.** Creating the template throws `InvalidJsonDbApiUsageException` saying the folder isn't writable. To read such a folder, for example a read-only mount, open it in read-only mode with `JsonDBConfig.setReadOnly(true)` and the new `JsonDBTemplate(JsonDBConfig)` constructor.
- **Numeric ids are generated.** A document whose `@Id` is a `Long`, `Integer`, `long` or `int` and that's saved without an id now gets the next number after the highest id in its collection. For `long` and `int`, 0 counts as no id: if you have such a document stored under 0, `upsert` of it now inserts a new document, so give it another id.
- **The folder and backup path can be a `java.nio.file.Path`.** Every constructor that takes the folder as a `String` has a `Path` version, so a literal `null` passed as the folder or the backup path no longer compiles. If you implement `JsonDBOperations` yourself, add `backup(Path)` and `restore(Path, boolean)`.
- **Methods that take or return a `java.io.File` are deprecated**, such as `JsonDBConfig.getDbFilesLocation()`, in favour of their `Path` versions. They'll be removed in a future release.

1.1.93 also fixes `updateCollectionSchema()` with `compatibilityMode` off, which failed with "Collection ... not found" when the file still had properties the class no longer has.

## From 1.1.16

Upgrade straight to `1.1.93`, and read [From 1.1.63](#from-1163) too. Every fix marked 1.1.63 above applies to you. The other change to check for is that writes which can't be saved now throw `JsonDBException` instead of returning normally; see [Errors that used to be hidden now surface](#errors-that-used-to-be-hidden-now-surface).

The [changelog](https://github.com/Jsondb/jsondb-core/blob/master/CHANGELOG.md) has the full list.
