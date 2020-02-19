var express = require('express');
const fs = require('fs')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const qs = require('qs')

const app = express()
const port = 55555

const multer  = require('multer')
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

let code = null
let privateKey = null


app.use(express.static('public'));

app.post('/credentials', upload.single('privateKey'), function (req, res, next) {
  const privateKey = req.file.buffer
  const {client_id} = req.body
  generateToken(privateKey, client_id, res)
})


app.get('/', function(req, res, next) {
  
  code = req.query.code
  if (!code) {
    // Code is required to obtain access token
    return res.sendFile(__dirname + '/views/index_noCode.html');
  } else {
    return res.sendFile(__dirname + '/views/index.html');
  }
});
  
function generateToken(privateKey, client_id, res) {
  const tokenUrl = 'https://sandbox-b2b.revolut.com/api/1.0/auth/token' // should be changed to production url
  const issuer = 'revolut-jwt-sandbox.glitch.me' // Issuer for JWT, should be derived from your redirect URL
  const aud = 'https://revolut.com' // Constant
  const exp = Date.now() / 1000 + 60

  const payload = {
    "iss": issuer,
    "sub": client_id,
    "aud": aud
  }
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: 60 * 60});
  axios({
    method: 'POST',
    url: tokenUrl,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    // It's important to stringify data since we're sending www-form-urlencoded data
    data: qs.stringify({
      "grant_type": "authorization_code",
      "code": code,
      "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      "client_id": client_id,
      "client_assertion": token,
    })
  }).then((result) => {
    res.json(result.data);
  }).catch(e => {
    console.dir(e)
    res.send(e)
  })
}

const listener = app.listen(port, function() {
  console.log('app is listening on port ' + listener.address().port);
});
