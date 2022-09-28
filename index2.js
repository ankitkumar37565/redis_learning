const PORT = 3022;
const REDISPORT = 6379;
const qs = require("qs");
const express = require("express");
const axios = require("axios");
const redis = require("redis");
const app = express();

//connect to redis and create redis client
let redisClient;
(async () => {
  redisClient = redis.createClient(REDISPORT);
  await redisClient.connect();
  redisClient.on("error", (err) => {
    console.log("-------------redis connection error--------\n", err);
  });
})();

app.use(express.json())
app.get("/getAge", async (req, res) => {
  try {
    let cachedResult = await redisClient.get(req.query.name);
    if (cachedResult) {
      return res.status(200).send({
        success: true,
        message: "data fetched from cache",
        data: JSON.parse(cachedResult),
      });
    } else {
      let requestConfig = {
        method: "get",
        url: `https://api.agify.io?name=${req.query.name}`,
      };
      console.log(requestConfig.url);
      let response = await axios(requestConfig);
      await redisClient.setEx(req.query.name,10,JSON.stringify(response.data)); // set with expiry second
      return res.status(200).send({
        success: true,
        message: "data not present in cache",
        data: response.data,
      });
    }
  } catch (e) {
    return res
      .status(200)
      .send({ success: false, message: e.message ? e.message : "error" });
  }
});
app.listen(PORT, () => {
  console.log(`server running on port:${PORT}`);
});
