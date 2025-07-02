import User from "../../schema/user.schema";

export const userResolvers = {
  Query: {
    users: async () => await User.find({}),
  },
};
