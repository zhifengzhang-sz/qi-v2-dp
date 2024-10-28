## Enhance conceptual diagram

@import "./dot/qi_system_enhanced.dot" {as="dot"}

Explanation of the Diagram:

- External Entities:

  - Data Sources: External providers like CryptoCompare, TwelveData, etc.
  - Applications: User interfaces or services that consume data or submit strategies.
  - Databases: Storage systems for historical data, backtesting results, etc.
  - Brokers: Trading platforms for live execution (planned for future integration).
  - Visualization Tools: Tools like TradingView and Grafana for data visualization.

- Core Data Platform:

  - Producer: Fetches data from external sources using the IDataProvider interface.
  - Data Stream: Redpanda/Kafka used for internal communication between components.
  - Consumer: Consumes data from the data stream using the IConsumer interface and stores it in databases.
  - Data Worker: Processes and cleans data using the IDataWorker interface, then publishes it back to the data stream.
  - Data Store: Orchestrates producers, consumers, and data workers; provides data services to applications.
  - Backtesting Engine: Executes trading strategies using the IAlgorithm interface; interacts with data store and databases.
  - Monitors & Managers: Oversee the operation and performance of the system components.

- Interfaces (Inspired by Eclipse Trader & Lean):

  - IDataProvider, IConsumer, IDataWorker, IAlgorithm, IPortfolio, IOrder, ISecurity, IScheduler: Define standardized methods and properties for components, ensuring modularity and interoperability.

- Data Flow and Interactions:

  - Producers fetch data from Data Sources and publish it to the Data Stream.
  - Consumers and Data Workers consume data from the Data Stream.
  - Data Workers process data and may publish cleaned data back to the Data Stream.
  - Consumers store data in Databases.
  - Data Store orchestrates the activities of Producers, Consumers, and Data Workers, and serves data to Applications.
  - Backtesting Engine receives strategies from Applications, requests data from the Data Store, stores results in Databases, and provides data to Visualization Tools.
  - Visualization Tools query data from Databases and may receive real-time data from the Data Store.
  - Monitors & Managers oversee the system's components.
  - Interfaces are linked to their respective components, indicating that these components implement the interfaces inspired by Eclipse Trader and Lean.