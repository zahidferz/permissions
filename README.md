[![Build Status](https://dev.azure.com/eleva-inc/gx-boa-ms-permissions/_apis/build/status/gx-boa-ms-permissions?branchName=develop)](https://dev.azure.com/eleva-inc/gx-boa-ms-permissions/_build/latest?definitionId=34&branchName=develop) 

# gx-boa-ms-permissions

Permissions API for Gestionix Platform

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

**Recommended  tools:**
 - [Docker](https://www.docker.com/)
 - [VSCode](https://code.visualstudio.com/)

**Requirements:**
 - [Node](https://nodejs.org/en/) >= 10.5
 - [npm](https://www.npmjs.com/) (included in node installation)
 - [git](https://git-scm.com/)

### Installing and running (without Docker)
In this section a is shown how to get a development env running for gx-boa-ms-permissions without Docker:

*before starting the server is recommended to define a ***.env*** file in the root folder of the project to define some environment variables. refer to ENVIRONMENT VARIABLES section*
```
npm install
```
```
npm run migrate-cosmos-db
```
```
npm run dev
```
a resulting terminal message will be shown when everything has been executed
```
[nodemon] 1.18.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching: *.*
[nodemon] starting `babel-node app.js`
Server ready at http://localhost:80/
```
### Installing and running (with Docker-Compose)

In this section a is shown how to get a development env running for *gx-boa-ms-permissions* with Docker:
*before starting the server is recommended to define a ***.env*** file in the root folder of the project to define some environment variables. refer to ENVIRONMENT VARIABLES section*
for more information check this [Gestionix Docker Guide](https://gestionix.atlassian.net/wiki/spaces/BOA/pages/692781500/Gestionix+Docker+Documentation+V+0.1)

To run with docker compose
```
docker-compose -f "docker-compose.dev.yml" up -d --build
```
this command will build all the required steps to execute the project in dev mode.
Steps done with docker-compose.dev.yml are listed below

 1. Build and run *gx-boa-ms-permissions* image
 2. Run a sql server container
 3. Run a redis server container
 4. Run a flyway migration server container (will perform all migrations in db/migrations)
(these steps may take a while the first time please)
After all the setup you can navigate to the url of docker machine to see the app running.

## Running the tests

There are three commands to execute tests
### Unit Tests
Running only unit tests in project
```
npm run unit-tests
```
to run unit tests no environment variables setup is required.
> After the execution of this test Jest will create an output file called *unit-test-results.xml* inside folder *test_results*
> Setting file for unit test is in tests/jest.config.unit.json

to specify your own unit test file name the file with the following pattern:

> **.*.unit.test.js$**
> eg. *validator.unit.test.js, mytest.unit.test.js, customer.unit.test.js*

### Integration Tests
Running only integration tests in project
```
npm run integration-tests
```
**to run integration tests a environment variables setup is required.**
> After the execution of this test Jest will create an output file called *integration-test-results.xml* inside folder *test_results*
> Setting file for unit test is in tests/jest.config.integration.json
to specify your own unit test file name the file with the following pattern:

> **.*.ispec.test.js$**
> "ispec" Integration Specification
> eg. *auth.ispec.test.js, mytest.ispec.test.js, payments.ispec.test.js*

### All Tests
Running all tests in this project
```
npm run test
```
**this will run integration tests**

## Deployment

To build a CI/CD pipeline please refer to this [gestionix continuous delivery guide](https://gestionix.atlassian.net/wiki/spaces/BOA/pages/705003589/Continuous+delivery)

## .env Example File
```
# API Configurations
NODE_ENV=development
PORT=80
## localhost
DATABASE_HOST=<CHANGE_THIS_VALUE>
DATABASE_AUTH_KEY=<CHANGE_THIS_VALUE>
DATABASE_NAME=<CHANGE_THIS_VALUE>
CONTAINER_PROFILE_NAME=<OPTIONAL_VALUE> #default: Profiles
CONTAINER_PERMISSIONS_NAME=<OPTIONAL_VALUE> #default: Permissions
CONTAINER_PERMISSIONS_PROFILE_NAME=<OPTIONAL_VALUE> #default: PermissionsProfile
## OAUTH rest service
OAUTH_URL=<CHANGE_THIS_VALUE>
#Insights
APPINSIGHTS_INSTRUMENTATIONKEY=<CHANGE_THIS_VALUE>

NEW_RELIC_APP_NAME=<CHANGE_THIS_VALUE>
NEW_RELIC_LICENSE_KEY=<CHANGE_THIS_VALUE>
NEW_RELIC_ENABLED=<CHANGE_THIS_VALUE>
```
## Authors

* ** Omar Martinez** - *documentation* - [Omarmtz](https://github.com/Omarmtz)
* ** Primitivo Román** - *owner dev* - [primitivorm](https://github.com/primitivorm)
* ** Yocelin Garcia** - *dev* - [YocelinGR](https://github.com/YocelinGR)
