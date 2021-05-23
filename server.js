require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const bodyParser = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

let url_mapping = new Map();
let url_search_set = [];
let url_id = 0; 
let hostname_status="";
let url_list = [];



const url_redirect_middleware = (req,res,next) =>{

  const { short_url } = req.params;
 
  for (let [key,value] of Object.entries(url_search_set)) {
    if(value.toString()===short_url){
      req.redirected_url = key;
    }

    if(hostname_status){
      req.error = hostname_status;
    }
    
  }

  next();
}

const url_shortener_middleware = (req,res,next) =>{

  const { url } = req.body;
  /*const search_url =url.replace(/https?:\/\//, '');
  dns.lookup(search_url,function (err, addresses) {
    if (!addresses || err){
      hostname_status = 'invalid Hostname';
    }
  })*/
  
    if (
      url.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
      ) === null
    ){
      req.error= 'invalid url';
    }else{

      if (url_list.find((element) => element === url) === url) {
        req.short_url = url_mapping.get(url);
      } else {
        url_mapping.set(url, url_id++);
        const map_obj = Array.from(url_mapping.entries()).reduce(
          (main, [key, value]) => ({ ...main, [key]: value }),
          {}
        );
        url_list = Object.keys(map_obj);
        url_search_set = map_obj;
        req.short_url = url_mapping.get(url);
      }

    }
  

  next();
}


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.get('/api/shorturl/:short_url',url_redirect_middleware, function(req, res) {
  let output=req.redirected_url
  if(req.error){
    output='/api/shorturl'
  }
  
  res.redirect(output);
});

app.get('/api/shorturl', function(req, res) {
  res.send({error:hostname_status});
});
  
  

app.post('/api/shorturl',url_shortener_middleware, function(req, res) {
  let output= {original_url:req.body.url,short_url:req.short_url}
 
  if(req.error){
    output={error:req.error}
  }

  res.send(output);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
