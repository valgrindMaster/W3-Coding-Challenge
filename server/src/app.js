const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const zipcodeinfo = require("./routes");

const PORT = 4000;

// Construct a schema, using GraphQL schema language
const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8")
);

// The root provides a resolver function for each API endpoint
const root = {
  zipcodeinfo,
};

const app = express();
app.use(cors());
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
app.listen(PORT);
console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`);
