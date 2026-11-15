---
title: Backup and restore
description: Back up the whole database to a zip file and restore it by replacing or merging.
---

`backup()` writes every collection file into one zip. `restore()` reads it back, either replacing the database or merging into it. Both hold the database's write locks while they run, so no writes happen part-way through.

Back up before [schema migrations](/guides/schema-versions/) and [key rotation](/guides/encryption/#changing-the-key), and on whatever schedule protects your data.

## Backing up

```java
db.backup("/backups/nightly.zip");
```

| You pass | JsonDB writes |
|---|---|
| A path ending in `.zip` | That file |
| A path without `.zip`, such as `/backups/nightly` | `/backups/nightly.zip` |
| An existing directory, such as `/backups/` | `/backups/jsondb-backup.zip` |

Missing parent directories are created. The zip holds one entry per collection, such as `users.json` and `servers.json`, exactly as they are on disk. [`@Secret`](/guides/encryption/) fields stay encrypted inside it. The `lock/` folder JsonDB uses while running isn't included.

## Restoring

`restore(path, merge)` accepts the same kinds of path. A directory means `jsondb-backup.zip` inside it. If the file doesn't exist, it throws `InvalidJsonDbApiUsageException`.

### Replace

```java
db.restore("/backups/nightly.zip", false);
```

The database becomes exactly what's in the backup. The current collection files are replaced and reloaded. Documents added since the backup are gone.

### Merge

```java
db.restore("/backups/nightly.zip", true);
```

Each document in the backup is [upserted](/guides/crud/#upsert) into the current database:

| Document is | After the merge |
|---|---|
| In both | The backup's version |
| Only in the backup | Added |
| Only in the database | Kept |

Collections that are in the backup but not in the database are added. With encryption, merge reads the backup's encrypted fields using the current cipher, so restore with the same key the backup was made with.

## Restoring into a fresh folder

A backup is an ordinary zip of `.json` files. You can also restore by unzipping it into an empty folder and opening a `JsonDBTemplate` on that folder.
