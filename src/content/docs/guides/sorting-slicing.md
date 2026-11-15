---
title: Sorting and slicing
description: Sort results with a Comparator and take part of them with Python-style slices.
---

`find` and `findAll` take two optional extra arguments: a `Comparator` that sorts the results, and a **slice** string that picks part of them.

```java
List<User> page = db.find("/.[age > 40]", User.class, comparator, "0:10");
List<User> all  = db.findAll(User.class, comparator, "0:10");
```

JsonDB sorts first, then slices.

## Sorting

Pass any `Comparator` for your class:

```java
// Java 8 and later
List<User> byName = db.findAll(User.class, Comparator.comparing(User::getName));

List<User> oldestFirst = db.find("/.[age > 40]", User.class,
    Comparator.comparingInt(User::getAge).reversed());
```

Or write the comparator out in full:

```java
Comparator<User> byAge = new Comparator<User>() {
  @Override
  public int compare(User a, User b) {
    return Integer.compare(a.getAge(), b.getAge());
  }
};
List<User> youngestFirst = db.findAll(User.class, byAge);
```

Without a comparator, results come back in the order the documents are stored.

## Slicing

A slice has the form `start:stop:step`, like Python's. Indexes start at 0, `stop` isn't included, and negative numbers count from the end. Any part can be left out.

These results are for five users sorted by age, `[u1, u2, u3, u4, u5]`:

| Slice | Means | Result |
|---|---|---|
| `0:2` | The first two | `u1, u2` |
| `:3` | The first three | `u1, u2, u3` |
| `2:` | All from the third on | `u3, u4, u5` |
| `-2:` | The last two | `u4, u5` |
| `::2` | Every second one | `u1, u3, u5` |
| `1:4:2` | Every second one from index 1 up to index 4 | `u2, u4` |
| `::-1` | All, reversed | `u5, u4, u3, u2, u1` |
| `10:20` | Past the end | empty |

To slice without sorting, pass `null` as the comparator:

```java
List<User> firstTwo = db.findAll(User.class, null, "0:2");
```

### Paging

Sort by something stable, then slice by page:

```java
int pageSize = 20;
int page = 3; // 0-based
String slice = (page * pageSize) + ":" + ((page + 1) * pageSize);
List<User> users = db.findAll(User.class, Comparator.comparing(User::getId), slice);
```
