---
title: Security notes
description: Query safety, what encryption covers, key handling, and how to report a vulnerability.
---

## Queries can't run code

Apache Commons JXPath can call any static Java method or constructor on the classpath from inside a query. Before 1.1.0, JsonDB left this on, so a query such as `/.[java.lang.System.exit(0)]` ran `System.exit`. An application that built queries from user input was open to remote code execution.

From 1.1.0, JsonDB turns extension functions off, and such a query fails with `JXPathFunctionNotFoundException`. **If you run 1.0.x and build queries from any input you don't control, upgrade.**

Core XPath functions such as `contains()`, `starts-with()`, `not()` and `count()` are part of XPath itself, not extension functions, and still work.

Disabling extension functions stops code execution, but not query injection: a value with a quote in it can still change what a query matches. Quote values carefully. See [Building queries from input](/guides/queries/#building-queries-from-input).

## What encryption covers

[`@Secret`](/guides/encryption/) encrypts the values of the fields you mark, using AES-GCM with a fresh random IV for each value. It doesn't hide:

- ids, or any field you didn't mark;
- collection names, document structure, or the number of documents;
- data in memory: JsonDB holds decrypted values in your objects.

Use operating-system file permissions to protect the database folder, and full-disk encryption if the whole database is sensitive.

## Keys

- Keep keys out of source code and out of the database folder. Load them from a secrets manager, an environment variable, or a platform keystore.
- `CryptoUtil.generate128BitKey(password, salt)` derives a key with PBKDF2-HMAC-SHA256 (65,536 iterations). Use a long passphrase and a unique salt.
- Rotate keys with `changeEncryption()`, after taking a [backup](/guides/backup-restore/).
- `DefaultAESCBCCipher` is deprecated. Move to `Default1Cipher`; see [Encryption](/guides/encryption/#defaultaescbccipher-deprecated).

## Dependencies

1.1.0 upgraded the dependencies that had known vulnerabilities (Jackson and Guava) and removed commons-beanutils and commons-collections. When 1.1.0 was released, an audit of every runtime, test and build dependency found no known vulnerabilities. Keep JsonDB, and the Jackson version your build resolves, up to date.

## Reporting a vulnerability

Please report security problems privately, not in a public issue. Use the **Report a vulnerability** button on the [jsondb-core Security tab](https://github.com/Jsondb/jsondb-core/security). Only the maintainers see the report.
