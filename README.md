> WIP, coming soon.

---

<p align="center">
  <img src="https://cdn.rawgit.com/constellators/constellate/8e303aad/assets/logo-full.png" width="250" height="152.84" />
</p>

<p align="center">
A toolchain to bootstrap, develop, release, publish, and deploy complex Node applications rapidly.
</p>

---

## TOC

 - [Introduction](#introduction)
 - [Getting started](#getting-started)
 - [Features](#features)
 - [Plugins](#plugins)
 - [Plugin Development](#plugin-development)
 - [Templates](#templates)

## Introduction

Constellate allows you to quickly create and deploy Node applications. You could build a simple single server Express application, or fan out a micro-service based system using a [monorepo](https://medium.com/@bebraw/the-case-for-monorepos-907c1361708a) format allowing you to share code and develop the system as the toolchain live update your servers whilst you code.

Most of the development tooling (bundling, transpiling, hot module reloading) are hidden away from you, available through a series of [plugins](#plugins).

## Getting Started

> TODO

## Features

> TODO

## Plugins

Constellate allows for a powerful plugin based system that allows you to target 3 seperate aspects of the system: compilation, development, and deployment.  We provide a strong set of Core plugin - some of which need to be explicitly installed in order to maintain a respectable bundle size of the core `constellate` package.

In addition to using one of the core plugins the system allows you to use any custom plugin, developed by your team or others.  Please see the ["Plugin Development"](#plugin-development) docs for more information.

### Compiler Plugins

#### none

> TODO

#### constellate-plugin-compiler-babel

> TODO

#### constellate-plugin-compiler-webpack

> TODO

#### constellate-plugin-compiler-webpack-node

> TODO

### Develop Plugins

#### none

> TODO

#### server

> TODO

#### constellate-plugin-develop-webpack

> TODO

### Deploy Plugins

#### none

> TODO

#### constellate-plugin-deploy-now

> TODO


## Plugin Development

> TODO
