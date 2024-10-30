import * as fs from "fs";

const baseUrl = "https://data-api.cryptocompare.com/asset/v1/";
const path = "summary/list";
const apikey =
  "3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe";
const params = {
  asset_lookup_priority: "SYMBOL",
  asset_type: "BLOCKCHAIN",
  filters: "HAS_CODE_REPOSITORIES,HAS_SUPPORTED_PLATFORM",
  api_key: apikey,
};
const url = new URL(baseUrl + path);
url.search = new URLSearchParams(params).toString();

const options = {
  method: "GET",
  headers: { "Content-type": "application/json; charset=UTF-8" },
};

fetch(url, options)
  .then((response) => response.json())
  .then((json) => {
    for ( const i in json.Data.List )
      console.log(i.NAME);
  })
  .catch((err) => console.log(err));
