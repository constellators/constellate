> WIP, coming soon. 👀

---

<p align="center">
  <img src="https://cdn.rawgit.com/constellators/constellate/8e303aad/assets/logo-full.png" width="250" height="152.84" />
</p>

<p align="center">
A toolchain to rapidly create and deploy Node applications.
</p>

## TOC

* [Introduction](#introduction)
* [Features](#features)
* [Getting started](#getting-started)
* [Plugins](#plugins)
* [Plugin Development](#plugin-development)
* [Templates](#templates)

## Introduction

Constellate allows you to quickly create and deploy Node applications. You could build a simple single server Express application, or fan out a micro-service based system using a [monorepo](https://medium.com/@bebraw/the-case-for-monorepos-907c1361708a) format allowing you to share code and develop the system as the toolchain live update your servers whilst you code.

Most of the development tooling (bundling, transpiling, hot module reloading) are hidden away from you, available through a series of [plugins](#plugins).

## Features

> TODO

## Getting Started

> TODO

## Plugins

Constellate allows for a powerful plugin based system that allows you to target 3 seperate aspects of the system: build, develop, and deploy. We provide a set of Core plugins - some of which need to be explicitly installed so that we keep the core `constellate` package size respectable.

In addition to using one of the core plugins the system allows you to use any custom plugin, developed by your team or others. Please see the ["Plugin Development"](#plugin-development) docs for more information.

### constellate-plugin-babel

> TODO

### constellate-plugin-flow

> TODO

### constellate-plugin-now

> TODO

### constellate-plugin-webpack

> TODO

### constellate-plugin-webpack-node

> TODO

## Plugin Development

> TODO
