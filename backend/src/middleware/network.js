// Middleware to set network context
const setNetworkContext = (req, res, next) => {
  // For now, we'll use a default network ID
  // In a real implementation, this would be determined by the domain or subdomain
  req.networkId = process.env.DEFAULT_NETWORK_ID || '550e8400-e29b-41d4-a716-446655440000';
  next();
};

module.exports = {
  setNetworkContext
};
