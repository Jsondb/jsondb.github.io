---
title: Upgrading from 1.0.x
description: What to change, and what behaves differently, when moving from JsonDB 1.0.x to 1.1.16.
---

1.1.0 was the first release since 1.0.115 in March 2020. Most code upgrades by changing the version number, but some behaviour has changed. Check this list, especially if you build queries from user input, use `findAndModify`, or migrate schemas.

## Dependency

Change the version to `1.1.16`. Drop any `-j8` or `-j11` suffix; one build now runs on Java 8 and later:

```diff lang="xml"
 <dependency>
   <groupId>io.jsondb</groupId>
   <artifactId>jsondb-core</artifactId>
-  <version>1.0.115-j11</version>
+  <version>1.1.16</version>
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
- A write whose final file move fails throws `JsonDBException` instead of appearing to succeed.
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

## Bugs fixed

These fixes need no change to your code, but they may explain odd behaviour you worked around:

- A batch `upsert()` mixing new and existing documents silently dropped the updates.
- A collection file with one bad line could be emptied by a later `getCollection()`.
- A thread that lost the race to create a collection could hang it.
- Merge-restore encrypted `@Secret` fields twice on encrypted databases.

The [changelog](https://github.com/Jsondb/jsondb-core/blob/master/CHANGELOG.md) has the full list.
