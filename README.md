> **Work in Progress** 👀
>
> Constellate is being built in parallel to a large scale production grade project, thereby getting some serious dogfooding in order to work out the kinks and settle on a useful API. Whilst we have made a lot of progress this is still very much an alpha version of the project, so we definitely would not recommend you use it.
>
> Do feel free to play though, and contributions are welcome to the moon and back. 😘

---

<p align="center">
  <img src="https://cdn.rawgit.com/constellators/constellate/8e303aad/assets/logo-full.png" width="250" height="152.84" />
</p>

<p align="center">
A toolchain to rapidly build, develop, test, publish and deploy Javascript packages and/or applications.
</p>

## TOC

* [Introduction](#introduction)
* [Requirements](#requirements)
* [Installation](#installation)
* [Features](#features)
* [Plugins](#plugins)
* [Plugin Development](#plugin-development)
* [Templates](#templates)

## Introduction

Constellate allows you to rapidly build, develop, publish and deploy Javascript packages/apps using a [monorepo](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9) structure, thereby enabling you to have the convenience of a single codebase repository without sacrificing modularity. If you are unfamiliar with monorepos and their benefits then I highly recommend that you read [this article](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9) (_tldr_: monorepos are a single repository containing multiple packages).

Constellate allows you to perform 5 key actions against your packages: build, develop, test, publish, and deploy. It can theoretically support any type of package (library/server/microservice/lamda-fn) via its flexible plugin system. What type of packages you wish to develop is up to you. You could manage multiple "libraries", publishing them to NPM, very much like the Babel monorepo. Or you could create a series of microservices, along with a [Create React App](https://github.com/facebook/create-react-app) UI, enjoying a tandem hot reloading development experience, with the ability to deploy them to a cloud provider of your choice.

The monorepo spine of Constellate is supported by using [Yarn](https://github.com/yarnpkg/yarn) as our package manager. Yarn has fantastic support for monorepos via its ["workspaces"](http://TODO) feature. Workspaces supports the lifting of your packages dependencies to the root folder (saving valuable disk space and bootstrapping time) and allows packages within your monorepo to depend on each other. Huge respect goes to the Yarn team for building and supporting this awesome feature.

Those familiar with monorepos may come to notice that Constellate is similar to [`Lerna`](https://lernajs.io) in some ways. This is absolutely true. Constellate derived a lot of its functionality from Lerna, and we highly recommend that you review Lerna to see if it may better fit your specific needs. That being said Constellate distinguishes itself from Lerna by exposing a plugin system and providing additional commands enabling a hot reloading development environment where updates are automatically cascaded through dependent packages. This allows an extremely fluid development experience where you can near instantly see the changes to one package reflect within all of its dependants. Constellate additionally provides a deployment command, allowing you to configure deployment of your packages to a supported hosting provider (via the plugins system).

## Requirements

* **Node >= 8**

  Version8 was LTS at the time of writing this. Use it 😀. That being said if you wish to create "server" packages that target lower versions you could restrict your JS API usage appropriately or use the Babel plugin to transpile to your target version.

* **[Yarn](https://github.com/yarnpkg/yarn)**

  Yep, as stated in the introduction we reuire Yarn. We highly suggest that you get yourself familiar with it, following their recommendation on how to install it on your system.

* Git

  We require that your monorepo be a Git repository. We rely heavily on Git's features to control effective publishing and deployment of your packages.

## Installation

> TODO

## Features

> TODO

## Plugins

Constellate allows for a powerful plugin based system that allows you to target 3 seperate aspects of the system: build, develop, and deploy. We provide a set of Core plugins - some of which need to be explicitly installed so that we keep the core `constellate` package size respectable.

In addition to using one of the core plugins the system allows you to use any custom plugin, developed by your team or others. Please see the ["Plugin Development"](#plugin-development) docs for more information.

> TODO: Overview of how plugins integrate

> TODO: built in plugins

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

> TODO Plugin API etc
