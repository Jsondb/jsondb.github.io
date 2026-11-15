---
title: Introduction
description: What JsonDB is, what it's good at, and when to pick something else.
---

JsonDB is an embedded database for Java. It runs inside your application, with no server to install or connect to, and it keeps your data in two places at once:

- **in memory**, as ordinary Java objects, so reads and queries are fast;
- **on disk**, as one plain `.json` file per collection, which every write updates before it returns.

You work with your own classes. Annotate a class with `@Document`, mark its id field with `@Id`, and JsonDB stores instances of it, queries them with [XPath](/guides/queries/), and can [encrypt](/guides/encryption/) the fields you mark `@Secret`.

```java
@Document(collection = "users", schemaVersion = "1.0")
public class User {
  @Id
  private String id;
  private String name;
  // getters and setters
}
```

```json title="users.json"
{"schemaVersion":"1.0"}
{"id":"1","name":"Ada Lovelace"}
```

## Where it fits

JsonDB is a good choice when you want persistence without running a database:

- **Application state and settings** for desktop apps, command-line tools, and Android apps.
- **Small services** whose data fits comfortably in memory: a few thousand to tens of thousands of documents per collection.
- **Tests and prototypes**, where you want real persistence you can read, diff, and reset by deleting a folder.
- **Data people need to read.** The files are line-per-document JSON. You can open them in an editor, check them into version control, or inspect them on a server.
- **Sensitive fields at rest.** `@Secret` fields are encrypted with AES-GCM before they reach the disk.

It runs on **Java 8 and later**, on **Android (API 26+)**, and under **OSGi**.

## When to use something else

JsonDB keeps every collection in memory and rewrites a collection's file when it changes. That design keeps it small and simple, but it isn't the right tool when:

- **Your data doesn't fit in memory**, or collections grow into the hundreds of thousands of documents. Use SQLite, H2, or a server database.
- **Several processes write to the same folder.** JsonDB is safe to share between threads in one JVM, but it doesn't coordinate writers across processes.
- **You need transactions across collections, joins, or SQL.** JsonDB's atomic operations ([`findAndModify`](/guides/find-and-modify/) and friends) work on one collection at a time.
- **Writes are constant and heavy.** Each write rewrites the collection file, so a write-heavy workload on a large collection is slow.

## Next steps

- [Install JsonDB](/start/installation/) with Gradle or Maven.
- Work through the [quick start](/start/quick-start/): a complete program in a few minutes.
