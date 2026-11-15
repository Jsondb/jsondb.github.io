---
title: Schema versions
description: Change a document class safely, then migrate its file with updateCollectionSchema.
---

Every collection file starts with the schema version of the class that wrote it:

```json title="people.json"
{"schemaVersion":"1.0"}
{"id":"1","firstName":"Ada","nickname":"Enchantress of Numbers"}
```

When you change a document class in a way that existing files no longer match, raise `schemaVersion` in its `@Document` annotation and migrate the file with `updateCollectionSchema()`. JsonDB checks the migration before it changes anything, and refuses one that would lose data.

## An example

Version 1.0 of a class had `firstName` and `nickname`. Version 1.1 renames `firstName` to `givenName`, adds `country`, and drops `nickname`:

```java title="Person.java"
@Document(collection = "people", schemaVersion = "1.1")
public class Person {
  @Id
  private String id;
  private String givenName;   // was "firstName" in 1.0
  private String country;     // new in 1.1
                              // "nickname" was removed in 1.1
  // getters and setters
}
```

### 1. Open with compatibility mode

The old file has properties that `Person` doesn't, `firstName` and `nickname`. Normally that's an error, and the collection doesn't load at all. Open the template with `compatibilityMode` set to `true` so those properties are tolerated:

```java
try (JsonDBTemplate db = new JsonDBTemplate(dbPath, Arrays.asList(Person.class), null, true, null)) {
  db.isCollectionReadonly(Person.class); // true: the file is 1.0, the class is 1.1
  // ...
}
```

The arguments after the class list are the cipher (`null` for none), `compatibilityMode`, and the schema comparator (`null` for the default). While the versions differ, the collection is **read-only**: reads work, and writes throw `InvalidJsonDbApiUsageException`.

### 2. Describe the changes and apply them

```java
CollectionSchemaUpdate update = CollectionSchemaUpdate
    .update("firstName", new RenameOperation("givenName"))
    .set("country", new AddOperation("unknown", false))
    .set("nickname", new DeleteOperation());

db.updateCollectionSchema(update, Person.class);

db.isCollectionReadonly(Person.class); // false
```

The classes are in `io.jsondb.query.ddl`. Afterwards, the file is stamped with the new version and the collection is writable again:

```json title="people.json"
{"schemaVersion":"1.1"}
{"id":"1","givenName":"Ada","country":"unknown"}
```

## The operations

| Operation | Effect | Rejected when |
|---|---|---|
| `new RenameOperation("newName")` | Moves each document's value from the old property to `newName`. | The class has no property called `newName`, or a document already has a value there. |
| `new AddOperation(defaultValue, isSecret)` | Sets the property to `defaultValue` in documents where it's **missing or `null`**. Existing values are kept. | The class has no such property. A `null` default does nothing. |
| `new DeleteOperation()` | Removes the property from every document. | The class **still has** the property. Remove it from the class first. |

For an added [`@Secret`](/guides/encryption/) field, pass `true` as `isSecret`. The default value must then be a `String`, and the template must have a cipher; JsonDB encrypts the default before storing it.

Several operations in one update are applied together, so renames that swap or chain property names work as you'd expect.

## Safety

`updateCollectionSchema` validates the whole update against your class before it reads or writes the file. A rejected update throws `InvalidJsonDbApiUsageException` explaining why, for example:

```text
Cannot rename 'givenName' to 'givenNmae' in collection people: Person has no property 'givenNmae', so the values would be lost
```

The file is left exactly as it was. Even so, [back up](/guides/backup-restore/) before migrating real data.

## Changes that don't need a migration

If a change doesn't make existing files invalid, you don't need to raise the version. For example, adding a field whose default can be `null` or zero is fine: documents without it simply read it as `null` or `0`.

## Comparing versions

By default, versions are compared as dotted numbers, so `1.10` is newer than `1.9`. Any difference in version makes the collection read-only. To compare versions differently, pass your own `Comparator<String>` as the last constructor argument.
