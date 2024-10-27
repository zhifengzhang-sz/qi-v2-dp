# Implementation

## Project structure

```md
.
|-- common
|   `-- src
|       |-- kafka
|       |   |-- consumer
|       |   `-- producer
|       |-- restapi
|       |   `-- cryptocompare
|       |-- utils
|       `-- websocket
|           `-- cryptocompare
|-- consumer
|   `-- src
|-- data_store
|   `-- src
|-- data_worker
|   `-- src
|-- db
|   `-- timescaledb
|       |-- models
|       `-- src
|-- producer
|   `-- src
`-- readme.md
```

## Setup the projects

First setup the base projects:
```bash
npm init -y
```
