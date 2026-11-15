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
- Set the id yourself before inserting. In 1.1.16, documents inserted without an id aren't stored reliably.

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

Every operation comes in two forms: one takes the class (`find(query, Server.class)`), and one takes the collection name (`find(query, "servers")`). Prefer the class form. It can't be misspelt, and in 1.1.16 a misspelt name makes some write operations fail with a bare `NullPointerException` instead of a clear error.
