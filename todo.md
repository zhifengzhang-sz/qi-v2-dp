1. data schema should be in layer 2, defined by dsl, should momve abstract/dsl to dsl, create actors, and move abstract, sources and targets to actors
2. exchange_id is needed, dsl data schema has no exchange_id, this is not right.
3. it seems we still having problem with dsl data schema as the signle source of truth, drizzle schema does not seem to follow the dsl scheme exactly. use 2 for testing the entire process of the schema control, from dsl -> layer 2 data schema and db models -> services
4. how the design and manage the kafka topics, how about the message schema
5. laws for layer 2, combinator law, among many others should be build soly based on the dsl, laws should be used to govern the layer 2 in the source code level. see docs/proposals/layer-2-laws
6. using mcp server for repanda and timescaledb, create the corresponding market data actors should be 4 of them (read and write)
7. real time feed in dsl
8. how to handle multiple mcp client in actor impl, currently we can handle zero or one
