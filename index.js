const express = require('express');
const mongoose = require('mongoose').default;
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('node:https');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI);

const Schema = mongoose.Schema;

function generateShortUrl() {
  const arr = new Uint16Array(1);
  return crypto.getRandomValues(arr).toString();
}

const urlSchema = new Schema({
  original_url: String,
  short_url: {
    type: String,
    required: true,
    default: generateShortUrl(),
  },
});

const Url = mongoose.model('Url', urlSchema);

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.get((req, res, next) => {
  Url.deleteMany();
  next();
});

function checkUrl(url) {
  return https.get(url, (res) => {
    return res.statusCode;
  });
}

app.post('/api/shorturl', async (req, res) => {
  try {
    await Url.deleteMany();
    await checkUrl(req.body.url);
    await Url.create({ original_url: req.body.url });
    const urlQuery = await Url.find();
    res.send({
      original_url: urlQuery[0].original_url,
      short_url: urlQuery[0].short_url,
    });
  } catch (error) {
    res.send({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const data = await Url.find();
  await res.redirect(data[0].original_url);
});

app.get('/', async (req, res) => {
  res.sendFile(`${__dirname}/views/index.html`);
});

app.listen(process.env.PORT || 3000);
