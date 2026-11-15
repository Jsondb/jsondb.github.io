---
title: Encryption
description: Encrypt @Secret fields at rest with AES-GCM, generate keys, and rotate them.
---

JsonDB can encrypt individual fields before they're written to disk. Mark the fields with `@Secret`, give the `JsonDBTemplate` a cipher, and JsonDB encrypts those fields on every write and decrypts them on every read. Your code only ever sees plain values.

## 1. Mark the fields

`@Secret` goes on `String` fields:

```java
@Document(collection = "servers", schemaVersion = "1.0")
public class Server {
  @Id
  private String id;
  private String hostname;
  @Secret
  private String adminPassword;
  // getters and setters
}
```

## 2. Create a key

`Default1Cipher` takes a Base64-encoded AES key. `CryptoUtil` can derive a 128-bit key from a passphrase and a salt:

```java
String base64Key = CryptoUtil.generate128BitKey("a long passphrase", "a unique salt");
```

Run this once, store the result somewhere safe, such as a secrets manager, an environment variable, or the Android Keystore, and load it at start-up. **Don't hard-code the key in your source**, and don't store it next to the database. Anyone with the files and the key can read every secret.

You can also use a 256-bit key from any source, encoded in Base64. On Java 8 before update 161, 256-bit AES needs the JCE Unlimited Strength policy files.

## 3. Pass the cipher

```java
ICipher cipher = new Default1Cipher(base64Key);

try (JsonDBTemplate db = new JsonDBTemplate(dbPath, Arrays.asList(Server.class), cipher)) {
  Server s = new Server();
  s.setId("db-1");
  s.setHostname("db-1.internal");
  s.setAdminPassword("correct horse battery staple");
  db.insert(s);

  db.findById("db-1", Server.class).getAdminPassword(); // "correct horse battery staple"
}
```

On disk, only the secret field is unreadable:

```json title="servers.json"
{"schemaVersion":"1.0"}
{"id":"db-1","hostname":"db-1.internal","location":null,"adminPassword":"pvZtULvADXUhZKzhnouVBSGmMOSN6G9nYpPyRyIy5rr7RrYVNbTQTZiVYFi7Q4sZJbeOREcrPG9C2ysF"}
```

## What's protected

- **Encrypted:** the values of `@Secret` fields.
- **Not encrypted:** ids, every other field, collection names, and the structure of your documents. Don't put sensitive data in ids.
- **Queries** can't match the plain value of a `@Secret` field, because they run against the stored ciphertext.

`Default1Cipher` uses AES in GCM mode with a random IV for every value, so equal values encrypt differently, and a value that's been tampered with fails to decrypt instead of decrypting to garbage.

## Changing the key

`changeEncryption()` re-encrypts every `@Secret` field with a new cipher. Back up the database first:

```java
db.backup("/backups/before-rekey.zip");
db.changeEncryption(new Default1Cipher(newBase64Key));
```

After this, open the database with the new key. Opening it with the old one fails when a secret field is read, with `JsonDBException: Incorrect key for this ciphertext (or ciphertext is corrupted)`.

## `DefaultAESCBCCipher` (deprecated)

Earlier versions documented `DefaultAESCBCCipher`, which uses AES in CBC mode. It's deprecated: CBC without authentication can't detect tampering. Use `Default1Cipher` for new databases. To move existing data, open the database with the old cipher and call `changeEncryption(new Default1Cipher(key))`.

## Your own cipher

To use a different algorithm or a key held in a hardware module, implement `io.jsondb.crypto.ICipher`:

```java
public interface ICipher {
  String encrypt(String plainText);
  String decrypt(String cipherText);
}
```

`encrypt` must return a string, typically Base64, and `decrypt` must reverse it exactly. Implementations must be thread-safe.
