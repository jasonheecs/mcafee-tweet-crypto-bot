const fs = require('fs');
const request = require('request');
const path = require('path');
const config = require('./config.json');
const winston = require('winston');
const Tesseract = require('tesseract.js');
const cryptocurrencies = require('cryptocurrencies');

const twitter = new (require('twit'))({
    consumer_key:         config.twitter.CONSUMER_KEY,
    consumer_secret:      config.twitter.CONSUMER_SECRET,
    access_token:         config.twitter.ACCESS_TOKEN,
    access_token_secret:  config.twitter.ACCESS_TOKEN_SECRET,
    timeout_ms:           60*1000
});

const stream = twitter.stream('statuses/filter', {
    'follow' : config.mcafeeTwitterId
});

const binance = new (require('binance')).BinanceRest({
    key: config.binance.API_KEY,
    secret: config.binance.API_SECRET,
    recvWindow: 10000
});

const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

const downloadImage = (uri, filename, callback) => {
    request.head(uri, function(err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

const options = {
    langPath: path.join(__dirname, "tesseract/langs") // Or wherever your downloaded langs are stored
};

var tesseractPromise = Tesseract.create(options);

tesseractPromise.recognize('./testt.jpg', {lang: "eng"}) // Or whichever lang you have downloaded to langs/
    .then((result) => console.log(result.text));

console.log(getKeyByValue(cryptocurrencies, "TRON"));

// downloadImage('https://www.google.com/images/srpr/logo3w.png', 'google.png', () => {


    // var tesseractPromise = tesseractjs.create({ langPath: "./tesseract/eng.traineddata" }).recognize('google.png', 'eng');


    // tesseract.recognize('google.png', {
    //     lang: 'eng'
    // })
    // .then(function(result){
    //     console.log(result);
    // })
    // .catch((err) => {
    //     console.error(err);
    // });
// });

// stream.on('tweet', (tweet) => {
//     if (!tweetIsOriginal(tweet)) {
//         return;
//     }

//     const msg = tweet.text;

//     if (msg.indexOf('Coin of the day') !== -1 || msg.indexOf('Coin of the week') !== -1) {
//         const regExp = /\(([^)]+)\)/;
//         const coinSymbols = msg.match(regExp);

//         if (coinSymbols !== null) {
//             const coinSymbol = coinSymbols[1];

//             logger.info('McAcfee recommends: ' + coinSymbol);

//             const txnSymbol = coinSymbol + 'ETH';

//             binance.ticker24hr({
//                 symbol: txnSymbol
//             })
//             .then((data) => {
//                 binance.newOrder({
//                     symbol: txnSymbol,
//                     side: 'BUY',
//                     type: 'LIMIT',
//                     timeInForce: 'GTC',
//                     quantity: config.qtyToBuy,
//                     price: data.bidPrice,
//                     timestamp: Date.now()
//                 })
//                 .then((data) => {
//                     logger.info(data);
//                 })
//                 .catch((err) => {
//                     logger.error(err);
//                 });
//             })
//             .catch((err) => {
//                 logger.error(err);
//             });
//         }
//     }
// });

function tweetIsOriginal(tweet) {
    return tweet.user.id_str == config.mcafeeTwitterId;
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}
