const axios = require("axios");

const getZipcodeInfo = async ({ countycode, zipcode }) => {
  const res = await axios.get(
    `http://www.zippopotam.us/${countycode}/${zipcode}`
  );

  if (res.status !== 200) {
    const err = new Error("bad response");
    err.statusCode = res.status;
    err.data = data;
    throw err;
  }

  const place = res.data.places[0];
  const city = place["place name"];
  const state = place["state"];

  return { city, state };
};

module.exports = getZipcodeInfo;
