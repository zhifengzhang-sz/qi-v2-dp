const baseUrl = 'https://data-api.cryptocompare.com/info/v1/version';
const params = {"api_key":"3c65ad72a61855ef0a467d53123a90f265e7ec58bd1360b58d392e89f9dc34fe"};
const url = new URL(baseUrl);
url.search = new URLSearchParams(params).toString();

const options = {
    method: 'GET',
    headers:  {"Content-type":"application/json; charset=UTF-8"},
};

fetch(url, options)
    .then((response) => response.json())
    .then((json) => console.log(json))
    .catch((err) => console.log(err));