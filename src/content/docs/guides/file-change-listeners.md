---
title: Watching for file changes
description: Get notified when another program adds, changes or deletes collection files.
---

JsonDB assumes it's the only writer of its folder. If another program edits the files, for example a person in a text editor, a sync tool, or a deployment script, register a listener to hear about it, and reload.

```java
CollectionFileChangeListener listener = new CollectionFileChangeAdapter() {
  @Override
  public void collectionFileAdded(String collectionName) {
    db.reloadCollection(collectionName);
  }

  @Override
  public void collectionFileModified(String collectionName) {
    db.reloadCollection(collectionName);
  }
};

db.addCollectionFileChangeListener(listener);
```

`CollectionFileChangeAdapter` implements every method with an empty body, so you override only the ones you need. The full interface, `io.jsondb.events.CollectionFileChangeListener`, has three methods:

| Method | Called when |
|---|---|
| `collectionFileAdded(String collectionName)` | A collection file appears in the folder, including when one is replaced by renaming another file over it. |
| `collectionFileDeleted(String collectionName)` | A collection file is deleted. |
| `collectionFileModified(String collectionName)` | A collection file is changed in place. |

Events are reported only for files named after a collection that one of your `@Document` classes declares.

Many programs, JsonDB included, save a file by writing a temporary file and renaming it over the original. That usually arrives as `collectionFileAdded` rather than `collectionFileModified`, which is why the example reloads on both.

## How it works

Adding the first listener starts a background thread that watches the folder with Java's `WatchService`. Events are delivered on that thread, so make your listener thread-safe and quick, and hand longer work to another thread.

How quickly events arrive depends on the operating system. Some platforms poll every few seconds, so don't rely on instant delivery.

JsonDB's own writes change the files too, so expect events for them as well. Reloading after your own write is harmless; it just costs a re-read.

## Removing listeners

```java
db.removeCollectionFileChangeListener(listener);
db.hasCollectionFileChangeListener(); // false when none are left
```

Removing the last listener stops the watcher thread. [Closing the template](/guides/jsondbtemplate/#closing) stops it too.

:::caution[Re-adding listeners in 1.1.16]
In 1.1.16, if you remove the last listener and then add one again, the watcher doesn't restart and the new listener receives no events. Keep at least one listener registered for as long as you need events, or create a new `JsonDBTemplate`.
:::
