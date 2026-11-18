---
title: Inserting, saving and removing
description: insert, save, upsert and remove, for single documents and batches, plus reading by id.
---

Every write updates the collection's file before the method returns. Every read returns **copies**: changing an object you got from JsonDB doesn't change the database until you write it back.

The examples use the `User` class from the [quick start](/start/quick-start/).

## Which write to use

| Method | If the id exists | If the id doesn't exist |
|---|---|---|
| `insert` | Fails | Adds the document |
| `save` | Replaces the document | Fails |
| `upsert` | Replaces the document | Adds the document |
| `remove` | Removes the document and returns it | Fails |

"Fails" means an `InvalidJsonDbApiUsageException` (a `RuntimeException`), and nothing is written.

Any write can also fail because JsonDB can't save the file, for example when the database folder is read-only. It then throws `JsonDBException`, also a `RuntimeException`, and the collection is left as it was, both in memory and on disk. This applies to `findAndModify` and the other [query-based writes](/guides/find-and-modify/) too.

## insert

```java
db.insert(new User("1", "Ada Lovelace", "ada@example.com", 36));
```

The collection comes from the object's `@Document` annotation. If a document with the same id already exists, `insert` throws `InvalidJsonDbApiUsageException`.

## save

Replaces an existing document with the same id:

```java
User ada = db.findById("1", User.class);
ada.setEmail("ada@analytical.engine");
db.save(ada, User.class);
```

If no document has that id, `save` throws `InvalidJsonDbApiUsageException`.

## upsert

Inserts the document, or replaces the one with the same id:

```java
db.upsert(new User("2", "Alan Turing", "alan@example.com", 41));    // added
db.upsert(new User("2", "Alan Turing", "turing@example.com", 41));  // replaced
```

## remove

`remove` matches by id and returns the document as it was stored:

```java
User removed = db.remove(new User("2", null, null, 0), User.class);
```

Only the id of the object you pass matters. If no document has that id, `remove` throws `InvalidJsonDbApiUsageException`.

To remove documents that match a query, use [`findAndRemove` and `findAllAndRemove`](/guides/find-and-modify/#removing-by-query).

## Batches

`insert`, `upsert` and `remove` also take a collection of documents. A batch rewrites the file once, so it's much faster than a loop of single calls.

```java
List<User> team = Arrays.asList(
    new User("10", "Grace Hopper", "grace@example.com", 85),
    new User("11", "Edsger Dijkstra", "edsger@example.com", 72));

db.insert(team, User.class);
db.upsert(team, User.class);
List<User> removed = db.remove(team, User.class);
```

A batch is all or nothing: if one document in a batch `insert` has an id that already exists, none of them are inserted.

## Reading

| Method | Returns |
|---|---|
| `findById(id, User.class)` | The document, or `null` if there's none with that id. |
| `findOne(query, User.class)` | The first document matching an [XPath query](/guides/queries/), or `null`. |
| `find(query, User.class)` | Every matching document. |
| `findAll(User.class)` | Every document in the collection. |
| `count(User.class)` | The number of documents, without copying them (new in 1.1.16). |

```java
User ada = db.findById("1", User.class);
List<User> everyone = db.findAll(User.class);
int total = db.count(User.class);
```

`find` and `findAll` can also [sort and slice](/guides/sorting-slicing/) their results.

## By class or by collection name

Every method has a form that takes the collection name instead of the class, such as `db.insert(user, "users")` and `db.findAll("users")`. Prefer the class form: it can't be misspelt. A name that no `@Document` class has, such as `"usres"`, fails with `InvalidJsonDbApiUsageException: Collection by name 'usres' not found`.

## Read-only collections

A collection whose file has a different schema version from its class is loaded **read-only**: reads work, writes throw `InvalidJsonDbApiUsageException`. `isCollectionReadonly(User.class)` tells you if that's the case. See [Schema versions](/guides/schema-versions/) for how to migrate it.
