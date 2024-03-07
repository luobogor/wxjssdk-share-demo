function parseJSON(jsonStr) {
  try {
    return JSON.parse(jsonStr);
  } catch (ex) {
    return null;
  }
}

module.exports = {
  parseJSON
}
