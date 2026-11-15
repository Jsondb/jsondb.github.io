---
title: Android and OSGi
description: Running JsonDB on Android (API 26+) and in OSGi containers.
sidebar:
  badge:
    text: New
    variant: tip
---

Since 1.1.0, JsonDB runs on **Android (API 26 and later)** and under **OSGi**. The same `io.jsondb:jsondb-core` artifact works on both; there's no separate build.

## The one rule: pass your classes

Package scanning finds `@Document` classes by searching the classpath. That doesn't work on Android, where classes are packaged as DEX, or under OSGi, where each bundle has its own class loader. Pass the classes to the constructor instead:

```java
JsonDBTemplate db = new JsonDBTemplate(dbPath, Arrays.asList(User.class, Server.class));
```

The constructors that take a package name aren't suitable on these platforms.

## Android

Keep the database in your app's private storage. The folder name is up to you:

```java
// In an Activity, Service or Application
String dbPath = new File(context.getFilesDir(), "jsondb").getAbsolutePath();
JsonDBTemplate db = new JsonDBTemplate(dbPath, Arrays.asList(User.class));
```

Things that work differently from older JsonDB versions, and no longer get in the way on Android:

- Queries don't need `java.beans`, which Android doesn't have. JsonDB reads your properties through their getters and setters instead.
- The built-in ciphers don't need the `SunJCE` security provider, so [encryption](/guides/encryption/) works with Android's providers. Data encrypted by older versions still decrypts.

Create the template once, for example in your `Application` class, and share it. See [One instance per folder](/guides/jsondbtemplate/#one-instance-per-folder).

:::caution[Keep your document classes]
If you shrink your app with R8 or ProGuard, keep the document classes and their getters, setters and no-argument constructors. JsonDB finds them by reflection, so the shrinker can't see that they're used. These rules are a starting point:

```text title="proguard-rules.pro"
-keep @io.jsondb.annotation.Document class * { *; }
-keep class com.example.model.** { *; }
```

The second rule keeps nested classes such as `Address`, which have no annotation; change the package to yours.
:::

## OSGi

Pass the classes from your bundle in the same way. The template uses the class objects you give it, so it doesn't need to see your bundle's packages through its own class loader.

```java
JsonDBTemplate db = new JsonDBTemplate(dbPath, Arrays.asList(User.class));
```
