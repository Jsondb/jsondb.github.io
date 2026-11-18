---
title: XPath cheat sheet
description: Common JsonDB query patterns at a glance.
---

Every query below has been run against JsonDB 1.1.63. Pass it to `find`, `findOne`, `findAndModify`, `findAllAndModify`, `findAndRemove` or `findAllAndRemove`. See [Querying with XPath](/guides/queries/) for the explanations.

## Matching

| Query | Matches documents where |
|---|---|
| `/.` | Always: every document. |
| `/.[name='Ada Lovelace']` | `name` equals the text. |
| `/.[name!='Ada Lovelace']` | `name` doesn't equal the text. |
| `/.[not(name='Ada Lovelace')]` | The same, written with `not()`. |
| `/.[age > 40]` | `age` is greater than 40. Also `>=`, `<` and `<=`. |
| `/.[age >= 36 and age <= 41]` | Both conditions hold. |
| `/.[age < 40 or age > 80]` | Either condition holds. |
| `/.[id='1' or id='3']` | The id is one of several values. |

## Text

| Query | Matches documents where |
|---|---|
| `/.[contains(email, '@example.com')]` | `email` contains the text. |
| `/.[starts-with(name, 'A')]` | `name` starts with the text. |
| `/.[string-length(name) > 13]` | `name` is longer than 13 characters. |
| `/.[name="O'Brien"]` | Double quotes allow an apostrophe in the value. |
| `/.[translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='ada lovelace']` | Case-insensitive equality: XPath 1.0 has no `lower-case()`. |

## Nested and missing values

| Query | Matches documents where |
|---|---|
| `/.[location/city='London']` | The nested object's `city` is `London`. |
| `/.[location]` | `location` is set (not `null`). |
| `/.[not(location)]` | `location` is `null`. |

## Not supported

| Query | Why |
|---|---|
| `/.[java.lang.System.exit(0)]` | Java method calls are disabled. It throws `JXPathFunctionNotFoundException`. |
| `/.[lower-case(name)='ada']` | XPath 2.0 functions aren't available. Use `translate()` as above. |
| `/.[adminPassword='secret']` on a `@Secret` field | The stored value is encrypted, so it never matches. |
