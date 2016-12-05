const qs = require("querystring"),
    https = require("https");

module.exports = {
    executeSearch(query, callback) {
        this.loadData("/search/users?q=" + qs.escape(query), callback);
    },
    loadProfile(username, callback) {
        this.loadData("/users/" + qs.escape(username), callback);
    },
    loadData: (path, callback) => {
        let options = {
            host: "api.github.com",
            port: 443,
            path: path,
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36",
                "Referer": "https://www.google.co.uk",
                "Connection": "keep-alive",
                "DNT": 1,
                "Accept-Language": "en-US"
            }
        };

        let request = https.request(options, (response) => {
            response.setEncoding("utf8");
            let data = "";
            response.on("data", buffer => {
                data += buffer;
            });
            response.on("end", () => {
                callback(JSON.parse(data));
            });
        });

        request.end();
    }
}