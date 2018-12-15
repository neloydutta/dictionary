const https = require('https');
const fs = require('fs');
var app_id = "";
var app_key = "";
var usage = "Usage:\n./dict <def|syn|ant> <word>";


var app_init = function(cb) {
    if(process.argv.length != 4){
        console.log('Invalid Arguments!\n' + usage);
        return;
    }
    fs.readFile('./secret.json','ascii', (err, data) => {
        if (err) throw err;
        data = JSON.parse(data);
        app_id = data["app_id"]
        app_key = data["app_key"]
        cb('def');
    });
}
   
 
  
var oxforddictionarycall = function(type,cb){
    var params = {
        host :  'od-api.oxforddictionaries.com',
        path : '/api/v1/entries/en/'+type,
        method : 'GET',
        headers : {
                "Accept": "application/json",
                "app_id": app_id,
                "app_key": app_key
                }
        };
    
    https.get(params, function(res) {
        if(res.statusCode == 404){
            cb("No such entry found");
        }
        else{
            var data = "";
            res.on('data', function(chunk) {
                    data +=  chunk;
            }).on('end',function(){
                try {
                    result = JSON.parse(data);
                } 
                catch (exp) {
                    cb('JSON Parse failed');
                }
                cb(null,result);
            }).on('error',function(err){
                cb(err);    
            });
        }
    });
}; 

var definition = function(error, result){
    if(error) console.log(error);
    if(result) console.log('Definition: '+result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['definitions'][0]);
}

var synonyms = function(error, result){
    if(error) console.log(error);
    if(result) console.log(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['synonyms']);
}
var antonyms = function(error, result){
    if(error) console.log(error);
    if(result) console.log(result['results'][0]['lexicalEntries'][0]['entries'][0]['senses'][0]['antonyms']);
}
var run_app = function(type){
    if(process.argv[2] == 'def')
        oxforddictionarycall(process.argv[3],definition);
    else if(process.argv[2] == 'syn')
        oxforddictionarycall(process.argv[3]+'/synonyms',synonyms);
    else if(process.argv[2] == 'ant')
        oxforddictionarycall(process.argv[3]+'/antonyms',antonyms);
    else
        console.log('Invalid Arguments!\n'+usage);
}

app_init(run_app);