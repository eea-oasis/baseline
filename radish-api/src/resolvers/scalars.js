import { GraphQLScalarType, Kind } from 'graphql';
import { isAddress } from 'web3-utils';

const Address = new GraphQLScalarType({
  name: 'Address',
  description: 'An account address',
  serialize: String,
  parseValue: input => (isAddress(input) ? input : undefined),
  parseLiteral: ast => {
    if (ast.kind !== Kind.STRING || !isAddress(ast.value)) {
      return undefined;
    }
    return String(ast.value);
  },
});

export default {
  Address,
};
