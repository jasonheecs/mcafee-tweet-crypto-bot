const config = require('./config.json');
const winston = require('winston');

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

stream.on('tweet', (tweet) => {
    if (!tweetIsOriginal(tweet)) {
        return;
    }

    const msg = tweet.text;

    if (msg.indexOf('Coin of the day') !== -1 || msg.indexOf('Coin of the week') !== -1) {
        const regExp = /\(([^)]+)\)/;
        const coinSymbols = msg.match(regExp);

        if (coinSymbols !== null) {
            const coinSymbol = coinSymbols[1];

            logger.info('McAcfee recommends: ' + coinSymbol);

            const txnSymbol = coinSymbol + 'ETH';

            binance.ticker24hr({
                symbol: txnSymbol
            })
            .then((data) => {
                binance.newOrder({
                    symbol: txnSymbol,
                    side: 'BUY',
                    type: 'LIMIT',
                    timeInForce: 'GTC',
                    quantity: config.qtyToBuy,
                    price: data.bidPrice,
                    timestamp: Date.now()
                })
                .then((data) => {
                    logger.info(data);
                })
                .catch((err) => {
                    logger.error(err);
                });
            })
            .catch((err) => {
                logger.error(err);
            });
        }
    }
});

function tweetIsOriginal(tweet)
{
    return tweet.user.id_str == config.mcafeeTwitterId;
}
