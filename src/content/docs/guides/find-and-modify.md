---
title: Updating with findAndModify
description: Change or remove the documents a query matches, atomically, with findAndModify and its relatives.
---

These methods find documents with an [XPath query](/guides/queries/) and change or remove them in one step. Each one holds the collection's write lock throughout, so no other thread can change the documents between the find and the update.

| Method | Changes | Returns |
|---|---|---|
| `findAndModify(query, update, User.class)` | The first match | The updated document, or `null` if nothing matched |
| `findAllAndModify(query, update, User.class)` | Every match | The updated documents |
| `findAndRemove(query, User.class)` | Removes the first match | The removed document, or `null` |
| `findAllAndRemove(query, User.class)` | Removes every match | The removed documents |

## Describing an update

An `io.jsondb.query.Update` lists the properties to set and their new values:

```java
Update update = Update.update("email", "ada@analytical.engine").set("age", 37);

User ada = db.findAndModify("/.[id='1']", update, User.class);
```

Properties the update doesn't name keep their values.

```java
List<User> changed = db.findAllAndModify("/.[age > 40]",
    Update.update("email", "retired@example.com"), User.class);
```

### Nested properties

Name a nested property with dots, or replace the whole nested object:

```java
db.findAndModify("/.[id='web-1']", Update.update("location.city", "Manchester"), Server.class);
db.findAndModify("/.[id='web-1']", Update.update("location", new Address("Paris", "FR")), Server.class);
```

Note the difference: updates use dots (`location.city`), while queries use slashes (`location/city`).

## How values are converted

Values are converted to the property's type with the same rules JsonDB uses to read its files. A value that's valid in the file is valid in an update, and a value that would lose data is rejected:

| Property type | Value | Result |
|---|---|---|
| `int` | `37`, `37L` or `"37"` | Set to 37 |
| `int` | `7.9` | Rejected: it would lose the fraction |
| `int` | `"forty"` | Rejected |
| `int` (any primitive) | `null` | Rejected |
| any | a property name the class doesn't have, such as `"nmae"` | Rejected |

A rejected update throws `InvalidJsonDbApiUsageException` naming the property and the reason, and changes nothing.

### The id can't change

An update can't change a document's `@Id`; it's rejected with `InvalidJsonDbApiUsageException`. (Before 1.1.16 it left the original in place and added a copy.) To change an id, remove the document and insert it with the new id. Setting the id to its current value is allowed.

### Encrypted fields

Values for [`@Secret`](/guides/encryption/) fields are encrypted before they're stored, as with any other write.

## Removing by query

```java
User removed = db.findAndRemove("/.[age > 80]", User.class);           // first match, or null
List<User> gone = db.findAllAndRemove("/.[contains(email, '@')]", User.class);
```
