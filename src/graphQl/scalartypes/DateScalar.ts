import { GraphQLScalarType, Kind } from "graphql";

const DateScalar = new GraphQLScalarType({
  name: "Date",
  description: "A date string, such as 2021-01-01",
  parseValue(value: unknown): Date {
    if (typeof value !== "string") {
      throw new Error("DateScalar can only parse string values");
    }
    return new Date(value); // value from the client
  },
  serialize(value: unknown): string {
    if (!(value instanceof Date)) {
      throw new Error("DateScalar can only serialize Date values");
    }
    return value.toISOString(); // value sent to the client
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new Error("DateScalar can only parse string literals");
  },
});

export default DateScalar;
