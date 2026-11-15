---
title: Querying with XPath
description: Find documents with JXPath expressions, and count them.
sidebar:
  badge:
    text: New
    variant: tip
---

JsonDB queries are [XPath](https://www.w3.org/TR/xpath-10/) expressions, evaluated by [Apache Commons JXPath](https://commons.apache.org/proper/commons-jxpath/) against your objects. Property names are your getters' names: `getName()` is `name`, and `getLocation().getCity()` is `location/city`.

A query selects documents with a predicate in square brackets:

```java
List<User> adults = db.find("/.[age >= 18]", User.class);
```

Read `/.[...]` as "every document where ...". `/.` on its own matches every document.

## Comparisons

```java
db.find("/.[name='Ada Lovelace']", User.class);         // equals
db.find("/.[name!='Ada Lovelace']", User.class);        // not equals
db.find("/.[age > 40]", User.class);                    // >, >=, <, <=
db.find("/.[age >= 36 and age <= 41]", User.class);     // and
db.find("/.[age < 40 or age > 80]", User.class);        // or
db.find("/.[not(name='Ada Lovelace')]", User.class);    // not()
```

Strings go in single or double quotes. Numbers don't need quotes.

## Functions

XPath's built-in functions work in queries:

```java
db.find("/.[contains(email, '@example.com')]", User.class);
db.find("/.[starts-with(name, 'A')]", User.class);
db.find("/.[string-length(name) > 13]", User.class);
```

Others include `normalize-space()`, `substring()`, `translate()`, `concat()`, `count()`, `sum()`, `floor()`, `ceiling()`, `round()`, `true()`, `false()` and `boolean()`. JXPath's documentation lists them all.

## Nested properties

Use `/` to step into nested objects:

```java
List<Server> inLondon = db.find("/.[location/city='London']", Server.class);
```

## One result, or a count

```java
User first = db.findOne("/.[starts-with(email, 'grace')]", User.class); // or null
int total = db.count(User.class);
```

`findOne` returns the first match, or `null` when nothing matches. `count` (new in 1.1.16) returns the number of documents in a collection without copying them; to count the matches of a query, use `find(query, User.class).size()`.

## Building queries from input

Queries are strings, so be careful when you build one from user input. A value containing a quote ends the string early and changes the query. If a value can contain `'`, put it in double quotes instead, and reject values that contain the quote you're using:

```java
String name = "O'Brien";
if (name.contains("\"")) {
  throw new IllegalArgumentException("Name can't contain a double quote");
}
List<User> matches = db.find("/.[name=\"" + name + "\"]", User.class);
```

:::note[Queries can't run Java code]
JXPath can call Java methods from a query (its "extension functions"). JsonDB 1.1.0 and later turn this off, so a query such as `/.[java.lang.System.exit(0)]` fails with `JXPathFunctionNotFoundException` instead of running. The built-in functions above aren't affected. See [Security notes](/reference/security/).
:::

## Errors

| Problem | Exception |
|---|---|
| Malformed query, such as `/.[name=` | `JXPathInvalidSyntaxException` |
| Unknown function, including any Java method | `JXPathFunctionNotFoundException` |
| Collection doesn't exist | `InvalidJsonDbApiUsageException` |

All three are `RuntimeException`s.

## Encrypted fields

[`@Secret`](/guides/encryption/) fields are stored encrypted, and queries run against the stored values, so a query can't match the plain value of an encrypted field. Query on other fields instead.

## More

- The [XPath cheat sheet](/reference/xpath-cheatsheet/) lists common patterns.
- [Sort and slice](/guides/sorting-slicing/) the results.
- [Update or remove](/guides/find-and-modify/) whatever a query matches.
