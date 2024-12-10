## qi/core
1. there are three data definition: 
   - base: this is used through out the system
   - data sources (e.g. cryptocompare among others)
   - orm data models for timescaledb and kafka/redpanda, we use sequelize for db, avro for kafka.
   
   data models should tied with data source data as they are used for storing the raw data, and i view both data source data and storage data is just the extensions of the base

2. if the data source data is extension of the base, we need to make sure (how?) the overlapping part of the data get feed from the process of obtaining data from data sources.

3. we need  to make sure the storage data schema is the same structure of the data source (the model should depends oon data source, in other words, each data source requires its own db data model, same for kafka)

4. we always need complete detailed jdoc in the source code, since this might be expensive, we can do that in the last stage.

5. network should be a module under core, not embedded in data module. It is a wrapper over restapi and websocket

## qi/producer

1. producer: get data from data source (right now we only consider cryptocompare), and publish the data (response) to kafka/redpanda
2. using xstate v5 for managing activities

## qi/consumer
1. consumer: get data from kafka and store it to timescaledb
2. using xstate v5 for managing activities

core is in the same level with producer and consumer

## tests
1. we use vitest and the test directory is parallel to the src directory under each main module (core, producer, consumer, ..., etc.)

## project configuration
1. we use es module