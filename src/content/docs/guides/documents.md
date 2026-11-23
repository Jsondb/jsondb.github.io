---
title: Defining documents
description: The @Document, @Id and @Secret annotations, and what a document class needs.
---

A **document** is an instance of one of your classes, stored as one line of JSON. A **collection** is all the documents of one class, stored in one `.json` file. You describe both with three annotations from `io.jsondb.annotation`.

```java
import io.jsondb.annotation.Document;
import io.jsondb.annotation.Id;
import io.jsondb.annotation.Secret;

@Document(collection = "servers", schemaVersion = "1.0")
public class Server {
  @Id
  private String id;
  private String hostname;
  private Address location;
  @Secret
  private String adminPassword;

  // a public no-argument constructor (implicit here), plus getters and setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getHostname() { return hostname; }
  public void setHostname(String hostname) { this.hostname = hostname; }
  public Address getLocation() { return location; }
  public void setLocation(Address location) { this.location = location; }
  public String getAdminPassword() { return adminPassword; }
  public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }
}
```

## `@Document`

Goes on the class. Both attributes are required.

| Attribute | Meaning |
|---|---|
| `collection` | The collection's name. JsonDB stores it in `<collection>.json` in the database folder, and the name-based methods such as `find(query, "servers")` use it. |
| `schemaVersion` | The version of this class's shape, such as `"1.0"`. It's written as the first line of the file. When you change the class in a way the old file doesn't match, raise the version and migrate the file. See [Schema versions](/guides/schema-versions/). |

## `@Id`

Marks the one field that identifies a document within its collection. Every `@Document` class needs exactly one.

- Use JsonDB's own `io.jsondb.annotation.Id`. Another framework's annotation, such as `javax.persistence.Id`, isn't recognised: JsonDB rejects the class with an `InvalidJsonDbApiUsageException` that names it.
- Ids are compared with `equals()`, so `String` and the boxed number types work well. Most examples use `String`.
- If a document has no id when you insert or upsert it, JsonDB generates one; see [Generated ids](#generated-ids).

### Generated ids

A document inserted or upserted without an id gets one from JsonDB:

| `@Id` type | Generated id |
|---|---|
| `String` | A random UUID. |
| `Long`, `Integer`, `long`, `int` | The next number after the highest id in the collection, starting at 1 (new in 1.1.93). For `long` and `int`, 0 counts as no id. |

The numbers are worked out from the documents, not kept as a sequence: if the document with the highest id is removed, the next insert gets that id again. They're safe for threads sharing one `JsonDBTemplate`, but not for several programs writing the same folder.

The object you passed keeps its empty id. To read the document back by id, find it first, or set the id yourself.

#### Your own ids

To make the ids yourself, give JsonDB an `IdGenerator` (new in 1.1.93). It receives the collection name and the document, so it can build the id from the document's fields. Set one for a class, or as the default for every class that has none of its own:

```java
db.setIdGenerator(Order.class, (collection, order) -> "ORD-" + ((Order) order).getNumber());
db.setIdGenerator((collection, document) -> UUID.randomUUID().toString().substring(0, 8));
```

`IdGenerator` is in `io.jsondb`, and `JsonDBConfig` has the same two setters. Pass `null` to go back to the default generator, or to JsonDB's own ids. A generator is used only for documents that have no id; one that already has an id keeps it.

JsonDB doesn't ask the generator twice. An id that's `null`, isn't of the `@Id` field's type, or is already in the collection is rejected with `InvalidJsonDbApiUsageException`, and nothing is saved. Calls for one collection never overlap, but a generator shared by several collections can be called from several threads at once, so make it thread-safe.

## `@Secret`

Marks a `String` field whose value is encrypted before it's written to disk and decrypted when you read it. It needs a cipher; see [Encryption](/guides/encryption/).

Only the marked fields are encrypted. The id and every other field are stored as plain JSON, and queries can't match on the value of an encrypted field.

## What a document class needs

- **A no-argument constructor**, so JsonDB can create instances when it reads the file. It can be the implicit one, as in `Server` above.
- **A public getter and setter for each stored field**, following JavaBean naming (`getHostname`/`setHostname`, or `isActive` for a `boolean`). JsonDB reads and writes fields through them, and queries use the same property names.
- It doesn't need to implement `Serializable`.

Fields can be any type Jackson can read and write: strings, numbers, booleans, enums, nested objects (like `Address` above), lists, maps, and Java 8 date-time types such as `LocalDate` and `Instant`. Nested classes need the same no-argument constructor and getters and setters, but no annotations.

## Collections

Create a collection once, before you write to it:

```java
if (!db.collectionExists(Server.class)) {
  db.createCollection(Server.class);
}
```

`createCollection` writes the new file with its schema-version line. `dropCollection(Server.class)` deletes the file and its documents. `getCollectionNames()` lists the collections that are currently loaded.

Every operation comes in two forms: one takes the class (`find(query, Server.class)`), and one takes the collection name (`find(query, "servers")`). Prefer the class form. It can't be misspelt; a misspelt name fails at run time with an `InvalidJsonDbApiUsageException`.
