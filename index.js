const express = require('express');
const mongoose = require('mongoose').default;
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const URL = require('url').URL;

function checkValidUrl(str) {
  try {
    const checkURL = new URL(str);
    return !!checkURL;
  } catch (err) {
    return false;
  }
}

function generateShortUrl() {
  const arr = new Uint16Array(1);
  return crypto.getRandomValues(arr).toString();
}

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI);

const Schema = mongoose.Schema;

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

app.post('/api/shorturl', async (req, res) => {
  if (checkValidUrl(req.body.url)) {
    try {
      await Url.create({ original_url: req.body.url });
      res.redirect('/api/shorturl/');
    } catch (err) {
      res.status(500).json({ err });
    }
  } else {
    res.send({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/', async (req, res) => {
  const urlQuery = await Url.find();
  res.send(urlQuery);
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const data = await Url.findOne({ short_url: req.params.short_url });
  res.redirect(data.original_url);
});

app.get('/', async (req, res) => {
  await Url.deleteMany({});
  res.sendFile(`${__dirname}/views/index.html`);
});

app.listen(process.env.PORT || 3000);
